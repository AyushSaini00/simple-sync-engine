/**
 * WebSocket Server for Sync Engine
 * Handles client connections and message routing
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import { SubscriptionManager } from "./subscription-manager.js";
import { ChangeWatcher } from "./change-watcher.js";
import type {
  ChangeEvent,
  ClientMessage,
  MutationOperation,
  ServerMessage,
} from "../shared/protocol.js";

export class SimpleSyncWebSocketServer {
  private wss: WebSocketServer;
  private db: Db;
  private subscriptionManager: SubscriptionManager;
  private changeWatcher: ChangeWatcher;

  constructor(server: Server, db: Db) {
    this.db = db;
    this.subscriptionManager = new SubscriptionManager();
    this.changeWatcher = new ChangeWatcher(db);

    // Create WebSocket server attached to HTTP server
    this.wss = new WebSocketServer({ server, path: "/sync" });

    this.setupWebSocketHandlers();
    this.setupChangeWatcher();
  }

  private setupWebSocketHandlers() {
    this.wss.on("connection", (socket: WebSocket) => {
      this.subscriptionManager.addClient(socket);

      socket.on("message", async (data) => {
        try {
          const message: ClientMessage = JSON.parse(data.toString());
          await this.handleMessage(socket, message);
        } catch (error) {
          this.send(socket, {
            type: "error",
            message: "Invalid message format",
          });
        }
      });

      socket.on("close", () => {
        this.subscriptionManager.removeClient(socket);
      });

      socket.on("error", (error) => {
        this.subscriptionManager.removeClient(socket);
      });
    });
  }

  private setupChangeWatcher() {
    this.changeWatcher.on(
      "change",
      (collection: string, change: ChangeEvent) => {
        this.broadcastChange(collection, change);
      },
    );
  }

  private async handleMessage(socket: WebSocket, message: ClientMessage) {
    switch (message.type) {
      case "subscribe":
        await this.handleSubscribe(socket, message.collection, message.filter);
        break;

      case "unsubscribe":
        this.handleUnsubscribe(socket, message.collection);
        break;

      case "mutate":
        await this.handleMutation(
          socket,
          message.collection,
          message.operation,
        );
        break;
    }
  }

  private async handleSubscribe(
    socket: WebSocket,
    collection: string,
    filter?: Record<string, unknown>,
  ) {
    // Register subscription
    this.subscriptionManager.subscribe(socket, collection, filter);

    // Start watching this collection if not already
    this.changeWatcher.watchCollection(collection);

    // Fetch and send initial data
    try {
      const documents = await this.db
        .collection(collection)
        .find(filter || {})
        .toArray();

      // Convert ObjectIds to strings for JSON serialization
      const serializedDocs = documents.map((doc) => ({
        ...doc,
        _id: doc._id.toString(),
      }));

      this.send(socket, {
        type: "sync",
        collection,
        documents: serializedDocs,
      });
    } catch (error) {
      console.error(`[SimpleSyncEngine] Error fetching ${collection}:`, error);

      this.send(socket, {
        type: "error",
        message: `Failed to fetch ${collection}`,
      });
    }
  }

  private handleUnsubscribe(socket: WebSocket, collection: string): void {
    this.subscriptionManager.unsubscribe(socket, collection);
  }

  private async handleMutation(
    socket: WebSocket,
    collection: string,
    operation: MutationOperation,
  ): Promise<void> {
    try {
      const col = this.db.collection(collection);

      switch (operation.op) {
        case "insert":
          await col.insertOne(operation.document as { [key: string]: unknown });
          break;

        case "update":
          await col.updateOne(
            { _id: new ObjectId(operation.id) },
            { $set: operation.changes },
          );
          break;

        case "delete":
          await col.deleteOne({ _id: new ObjectId(operation.id) });
          break;
      }
      // Change stream will pick up the mutation and broadcast automatically
    } catch (error) {
      console.error(`[SimpleSyncEngine] Mutation error:`, error);
      this.send(socket, {
        type: "error",
        message: "Mutation failed",
      });
    }
  }

  private broadcastChange(collection: string, change: ChangeEvent): void {
    const subscribers = this.subscriptionManager.getSubscribers(collection);

    for (const socket of subscribers) {
      this.send(socket, {
        type: "change",
        collection,
        change,
      });
    }
  }

  private send(socket: WebSocket, message: ServerMessage): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  close(): void {
    this.changeWatcher.close();
    this.wss.close();
  }
}
