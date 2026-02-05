import { useCallback, useEffect, useRef, useState } from "react";
import { useSimpleSyncContext } from "./SimpleSyncProvider.js";
import type { SyncDocument } from "../../shared/protocol.js";

interface UseSimpleSyncQueryResult<T> {
  /** The current data, undefined while loading */
  data: T[] | undefined;
  /** Whether the initial sync is in progress */
  loading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Manually refetch the data */
  refetch: () => void;
}

export function useSimpleSyncQuery<T extends SyncDocument>(
  collection: string,
  options?: {
    filter?: Record<string, unknown>;
  }
): UseSimpleSyncQueryResult<T> {
  const { subscribe, isConnected } = useSimpleSyncContext();

  const [data, setData] = useState<T[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasReceivedData = useRef(false);

  // manual refetch (re-subscribes)
  const refetch = useCallback(() => {
    setLoading(true);
    hasReceivedData.current = false;
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    hasReceivedData.current = false;
    setLoading(true);

    const unsubscribe = subscribe(collection, (documents, change) => {
      setData(documents as T[]);

      if (!hasReceivedData.current) {
        hasReceivedData.current = true;
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [collection, subscribe, isConnected]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
