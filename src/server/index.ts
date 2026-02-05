import { createServer, Server } from "http";
import type { Express } from "express";
import type { Db } from "mongodb";
import { SimpleSyncWebSocketServer } from "./websocket-server.js";

interface SyncEngineOptions {
  port?: number;
}

export function createSimpleSyncEngine(
  app: Express,
  db: Db,
  options: SyncEngineOptions = {}
) {
  // Create HTTP server from Express app
  const server = createServer(app);

  // Attach WebSocket server for sync
  let wsServer: SimpleSyncWebSocketServer | null = null;

  return {
    server,

    start(port?: number) {
      const listenPort = port || options.port || 3000;

      // Initialize WebSocket server
      wsServer = new SimpleSyncWebSocketServer(server, db);

      server.listen(listenPort, () => {
        console.log(
          `[SimpleSyncEngine] Server running on http://localhost:${listenPort}`
        );
        console.log(
          `[SimpleSyncEngine] WebSocket available at ws://localhost:${listenPort}/sync`
        );
      });
    },

    stop() {
      if (wsServer) {
        wsServer.close();
        wsServer = null;
      }
      server.close();
    },
  };
}
