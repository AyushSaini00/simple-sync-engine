/**
 * Subscription Manager
 * Tracks which clients are subscribed to which collections
 */

import type { WebSocket } from "ws";

interface Subscription {
  collection: string;
  filter?: Record<string, unknown>;
}

export class SubscriptionManager {
  // Map of client socket to their subscriptions
  private subscriptions = new Map<WebSocket, Set<Subscription>>();
  // Reverse index: collection -> clients subscribed to it
  private collectionClients = new Map<string, Set<WebSocket>>();

  // Register a new client connection
  addClient(socket: WebSocket) {
    this.subscriptions.set(socket, new Set());
  }

  // Remove a client and all their subscriptions
  removeClient(socket: WebSocket) {
    const subs = this.subscriptions.get(socket);
    if (subs) {
      for (const sub of subs) {
        this.collectionClients.get(sub.collection)?.delete(socket);
      }
    }
    this.subscriptions.delete(socket);
  }

  // Subscribe a client to a collection
  subscribe(
    socket: WebSocket,
    collection: string,
    filter?: Record<string, unknown>
  ) {
    const subs = this.subscriptions.get(socket);
    if (!subs) return;

    const subscription: Subscription = { collection, filter };
    subs.add(subscription);

    // Add to reverse index
    if (!this.collectionClients.has(collection)) {
      this.collectionClients.set(collection, new Set());
    }
    this.collectionClients.get(collection)!.add(socket);
  }

  // Unsubscribe a client from a collection
  unsubscribe(socket: WebSocket, collection: string) {
    const subs = this.subscriptions.get(socket);
    if (!subs) return;

    // Find and remove matching subscription
    for (const sub of subs) {
      if (sub.collection === collection) {
        subs.delete(sub);
        break;
      }
    }

    // Update reverse index
    this.collectionClients.get(collection)?.delete(socket);
  }

  // Get all clients subscribed to a collection
  getSubscribers(collection: string): WebSocket[] {
    return Array.from(this.collectionClients.get(collection) || []);
  }

  // Check if a client is subscribed to a collection
  isSubscribed(socket: WebSocket, collection: string) {
    const subs = this.subscriptions.get(socket);
    if (!subs) return false;

    for (const sub of subs) {
      if (sub.collection === collection) return true;
    }
    return false;
  }

  // Get count of connected clients
  getClientCount() {
    return this.subscriptions.size;
  }
}
