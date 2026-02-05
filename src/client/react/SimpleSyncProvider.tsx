import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";
import { SimpleSyncClient } from "../client.js";
import type { ChangeEvent, SyncDocument } from "../../shared/protocol.js";

type SubscriptionCb = (data: SyncDocument[], change?: ChangeEvent) => void;

type SimpleSyncContextValue = {
  client: SimpleSyncClient | null;
  isConnected: boolean;
  subscribe: (collection: string, cb: SubscriptionCb) => () => void;
};

const SimpleSyncContext = createContext<SimpleSyncContextValue | null>(null);

export function SimpleSyncProvider({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  const clientRef = useRef<SimpleSyncClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const subscriptions = useRef<Map<string, Set<SubscriptionCb>>>(new Map());
  const collectionData = useRef<Map<string, SyncDocument[]>>(new Map());

  // subscribe to a collection
  const subscribe = useCallback((collection: string, cb: SubscriptionCb) => {
    // add to subscriptions map
    if (!subscriptions.current.has(collection)) {
      subscriptions.current.set(collection, new Set());
    }
    subscriptions.current.get(collection)!.add(cb);

    // send subscribe message to server
    clientRef.current?.subscribe(collection);

    // if we already have data, send it immediately
    const existingData = collectionData.current.get(collection);
    if (existingData) {
      cb(existingData);
    }

    // return unsubscribe func
    return () => {
      const cbs = subscriptions.current.get(collection);
      if (cbs) {
        cbs.delete(cb);

        if (cbs.size === 0) {
          subscriptions.current.delete(collection);
          clientRef.current?.unsubscribe(collection);
        }
      }
    };
  }, []);

  // notify all subscribers of a collection
  const notifySubs = (collection: string, change?: ChangeEvent) => {
    const cbs = subscriptions.current.get(collection);
    const data = collectionData.current.get(collection) || [];

    if (cbs) {
      cbs.forEach((cb) => cb(data, change));
    }
  };

  // apply a change to the local data store
  const applyChange = (collection: string, change: ChangeEvent) => {
    const data = collectionData.current.get(collection) || [];

    switch (change.op) {
      case "insert":
        collectionData.current.set(collection, [change.document, ...data]);
        break;

      case "update":
        collectionData.current.set(
          collection,
          data.map((doc) =>
            doc._id === change.id
              ? change.fullDocument || { ...doc, ...change.changes }
              : doc,
          ),
        );
        break;

      case "delete":
        collectionData.current.set(
          collection,
          data.filter((doc) => doc._id !== change.id),
        );
        break;
    }
  };

  useEffect(() => {
    const client = new SimpleSyncClient(url);
    clientRef.current = client;

    // handle connection state
    const unsubConnect = client.onConnect(() => setIsConnected(true));
    const unsubDisconnect = client.onDisconnect(() => setIsConnected(false));

    // handle incoming messages
    const unsubMessage = client.onMessage((message) => {
      if (message.type === "sync") {
        // initial sync - replace all data
        collectionData.current.set(message.collection, message.documents);
        notifySubs(message.collection);
      } else if (message.type === "change") {
        // incremental change
        applyChange(message.collection, message.change);
        notifySubs(message.collection, message.change);
      } else if (message.type === "error") {
        console.error("[SimpleSyncProvider] Error:", message.message);
      }
    });

    client.connect();

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubMessage();
      client.disconnect();
    };
  }, [url]);

  const value: SimpleSyncContextValue = {
    client: clientRef.current,
    isConnected,
    subscribe,
  };

  return (
    <SimpleSyncContext.Provider value={value}>
      {children}
    </SimpleSyncContext.Provider>
  );
}

export function useSimpleSyncContext() {
  const ctx = useContext(SimpleSyncContext);
  if (!ctx) {
    throw new Error(
      "useSimpleSyncContext must be used within a SimpleSyncProvider",
    );
  }

  return ctx;
}
