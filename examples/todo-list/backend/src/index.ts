import "./loadEnv.js"; // Must be first to load env vars before other imports
import app from "./server.js";
import db from "./db.js";
import { createSimpleSyncEngine } from "../../../../src/server/index.js";

const PORT = process.env.PORT || 3000;

const sync = createSimpleSyncEngine(app, db);
sync.start(Number(PORT));
