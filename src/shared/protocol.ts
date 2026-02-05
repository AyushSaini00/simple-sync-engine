/**
 * Shared protocol types for sync engine WebSocket communication
 */

import type { ObjectId } from "mongodb";

export interface SyncDocument {
  _id: string | ObjectId;
  [key: string]: unknown;
}

// Client -> server messages

export interface SubscribeMessage {
  type: "subscribe";
  collection: string;
  filter?: Record<string, unknown>;
}

export interface UnsubscribeMessage {
  type: "unsubscribe";
  collection: string;
}

export interface MutateMessage {
  type: "mutate";
  collection: string;
  operation: MutationOperation;
}

export type ClientMessage =
  | SubscribeMessage
  | UnsubscribeMessage
  | MutateMessage;

// Server -> Client Messages

export interface SyncMessage {
  type: "sync";
  collection: string;
  documents: SyncDocument[];
}

export interface ChangeMessage {
  type: "change";
  collection: string;
  change: ChangeEvent;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export type ServerMessage = SyncMessage | ChangeMessage | ErrorMessage;

export type MutationOperation =
  | { op: "insert"; document: Omit<SyncDocument, "_id"> }
  | { op: "update"; id: string; changes: Record<string, unknown> }
  | { op: "delete"; id: string };

export type ChangeEvent =
  | { op: "insert"; document: SyncDocument }
  | {
      op: "update";
      id: string;
      changes: Record<string, unknown>;
      fullDocument?: SyncDocument;
    }
  | { op: "delete"; id: string };
