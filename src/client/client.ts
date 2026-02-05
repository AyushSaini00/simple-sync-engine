import type { ClientMessage, ServerMessage } from "../shared/protocol.js";

type SyncClientOptions = {
  autoReconnect?: boolean /** Auto-reconnect on disconnect (default: true) */;
  reconnectDelay?: number /** Reconnect delay in ms (default: 1000) */;
};
type MessageHandler = (message: ServerMessage) => void;
type ConnectionHandler = () => void;

export class SimpleSyncClient {
  private url: string;
  private options: SyncClientOptions;
  private ws: WebSocket | null = null;
  private isConnecting = false;
  private pendingMessages: ClientMessage[] = [];
  private connectHandlers = new Set<ConnectionHandler>();
  private messageHandlers = new Set<MessageHandler>();
  private disconnectHandlers = new Set<ConnectionHandler>();

  constructor(url: string, options: SyncClientOptions = {}) {
    this.url = url;
    this.options = {
      autoReconnect: options.autoReconnect ?? true,
      reconnectDelay: options.reconnectDelay ?? 1000,
    };
  }

  // connect to the sync server
  connect() {
    if (this.ws || this.isConnecting) return;

    this.isConnecting = true;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.isConnecting = false;

      // send any pending messages
      for (const msg of this.pendingMessages) {
        this.send(msg);
      }
      this.pendingMessages = [];

      // notify handlers
      this.connectHandlers.forEach((h) => h());
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.messageHandlers.forEach((h) => h(message));
      } catch (err) {
        console.error("[SimpleSyncClient]: Failed to parse message: ", err);
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.isConnecting = false;
      this.disconnectHandlers.forEach((h) => h());

      // auto reconnect
      if (this.options.autoReconnect) {
        setTimeout(() => this.connect(), this.options.reconnectDelay);
      }
    };

    this.ws.onerror = (error) => {
      console.error("[SimpleSyncClient] Error:", error);
    };
  }

  // disconnect from the sync server
  disconnect() {
    this.options.autoReconnect = false;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // queue for when connected
      this.pendingMessages.push(message);
    }
  }

  // subscribe to a collection
  subscribe(collection: string, filter?: Record<string, unknown>) {
    this.send({ type: "subscribe", collection, filter });
  }

  // unsubscribe from a collection
  unsubscribe(collection: string) {
    this.send({ type: "unsubscribe", collection });
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // register message handler
  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);

    return () => this.messageHandlers.delete(handler);
  }

  // register connect handler
  onConnect(handler: ConnectionHandler) {
    this.connectHandlers.add(handler);

    return () => this.connectHandlers.delete(handler);
  }

  // register disconnect handler
  onDisconnect(handler: ConnectionHandler) {
    this.disconnectHandlers.add(handler);

    return () => this.disconnectHandlers.delete(handler);
  }
}
