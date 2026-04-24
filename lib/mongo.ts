import { Db, MongoClient } from "mongodb";

const DB_NAME = "tracktick";

const globalForMongo = globalThis as typeof globalThis & {
  __tracktickMongoClient?: MongoClient;
};

let client: MongoClient | undefined;

function getUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri?.trim()) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local next to package.json (the TrackTick app root) and restart the dev server.",
    );
  }
  return uri.trim();
}

export async function connectMongo(): Promise<void> {
  if (globalForMongo.__tracktickMongoClient) {
    client = globalForMongo.__tracktickMongoClient;
    return;
  }
  if (client) return;

  const c = new MongoClient(getUri());
  await c.connect();
  client = c;
  globalForMongo.__tracktickMongoClient = c;

  const db = c.db(DB_NAME);
  await Promise.all([
    db.collection("tasks").createIndex({ id: 1 }, { unique: true }),
    db.collection("pomodoro_sessions").createIndex({ id: 1 }, { unique: true }),
    db.collection("calendar_events").createIndex({ id: 1 }, { unique: true }),
  ]);
}

export function getMongoClient(): MongoClient {
  if (!client) {
    throw new Error("MongoDB not initialized — connectMongo should run from instrumentation");
  }
  return client;
}

export function getDb(): Db {
  return getMongoClient().db(DB_NAME);
}

export async function nextSequence(db: Db, name: string): Promise<number> {
  const counters = db.collection<{ _id: string; seq: number }>("counters");
  const updated = await counters.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  const seq = updated?.seq;
  if (typeof seq !== "number") {
    throw new Error(`Failed to allocate id for ${name}`);
  }
  return seq;
}

export type TaskRow = {
  id: number;
  title: string;
  done: boolean;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  createdAt: string;
};
