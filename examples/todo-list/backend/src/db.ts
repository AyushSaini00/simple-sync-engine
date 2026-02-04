import { MongoClient, ServerApiVersion, Db } from "mongodb";

const MONGO_DB_URI = process.env.MONGO_DB_URI;
if (!MONGO_DB_URI) {
  throw new Error("Please add your Mongo DB URI to .env");
}

const client = new MongoClient(MONGO_DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let conn: MongoClient | null;

try {
  conn = await client.connect();
} catch (err) {
  console.error("failed to connect to mongodb: ", err);
  process.exit(1);
}

const db: Db = conn.db("sync-engine-demo");

export default db;
