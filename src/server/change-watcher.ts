/**
 * MongoDB Change Stream Watcher
 * Listens for changes in MongoDB collections and emits events
 */

import { EventEmitter } from "events";
import type { Db, ChangeStreamDocument, ChangeStream } from "mongodb";

export class ChangeWatcher extends EventEmitter {
  private db: Db;
  private changeStreams = new Map<string, ChangeStream>();
  private watchedCollections = new Set<string>();

  constructor(db: Db) {
    super();
    this.db = db;
  }

  // Start watching a collection for changes
  watchCollection(collection: string) {
    if (this.watchedCollections.has(collection)) {
      return; // Already watching
    }

    const changeStream = this.db.collection(collection).watch([], {
      fullDocument: "updateLookup", // Get full document on updates
    });

    changeStream.on("change", (change: ChangeStreamDocument) => {
      const event = this.transformChange(change);
      if (event) {
        this.emit("change", collection, event);
      }
    });

    changeStream.on("error", (error) => {
      // Try to reconnect after error
      this.unwatchCollection(collection);
      setTimeout(() => this.watchCollection(collection), 1000);
    });

    this.changeStreams.set(collection, changeStream);
    this.watchedCollections.add(collection);
  }

  // Stop watching a collection
  unwatchCollection(collection: string) {
    const stream = this.changeStreams.get(collection);
    if (stream) {
      stream.close();
      this.changeStreams.delete(collection);
      this.watchedCollections.delete(collection);
    }
  }

  // Transform MongoDB change event to our protocol format
  private transformChange(change: ChangeStreamDocument) {
    switch (change.operationType) {
      case "insert":
        return {
          op: "insert",
          document: {
            ...change.fullDocument,
            _id: change.fullDocument!._id.toString(),
          },
        };

      case "update":
      case "replace":
        return {
          op: "update",
          id: change.documentKey._id.toString(),
          changes: change.updateDescription?.updatedFields || {},
          fullDocument: change.fullDocument
            ? {
                ...change.fullDocument,
                _id: change.fullDocument._id.toString(),
              }
            : undefined,
        };

      case "delete":
        return {
          op: "delete",
          id: change.documentKey._id.toString(),
        };

      default:
        return null;
    }
  }

  // Close all change streams
  close() {
    for (const [collection] of this.changeStreams) {
      this.unwatchCollection(collection);
    }
  }
}
