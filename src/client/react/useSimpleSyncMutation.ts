import { useCallback, useState } from "react";
import { useSimpleSyncContext } from "./SimpleSyncProvider.js";
import type { SyncDocument } from "../../shared/protocol.js";

export type MutationOp<T> =
  | { type: "insert"; document: Omit<T, "_id"> }
  | { type: "update"; id: string; changes: Partial<T> }
  | { type: "delete"; id: string };
interface UseSimpleSyncMutationResult<T> {
  /** Execute a mutation */
  mutate: (operation: MutationOp<T>) => string | undefined;
  /** Whether a mutation is in progress */
  loading: boolean;
  /** Any error that occurred */
  error: Error | null;
}

export function useSimpleSyncMutation<T extends SyncDocument>(
  collection: string
): UseSimpleSyncMutationResult<T> {
  const { client } = useSimpleSyncContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    (operation: MutationOp<T>): string | undefined => {
      if (!client) {
        setError(new Error("Not connected to sync server"));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let op;

        switch (operation.type) {
          case "insert":
            op = {
              op: "insert",
              document: operation.document,
            };
            break;

          case "update":
            op = {
              op: "update",
              id: operation.id,
              changes: operation.changes,
            };
            break;

          case "delete":
            op = { op: "delete", id: operation.id };
            break;
        }

        client.send({
          type: "mutate",
          collection,
          operation: op,
        });

        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    },
    [client, collection]
  );

  return {
    mutate,
    loading,
    error,
  };
}
