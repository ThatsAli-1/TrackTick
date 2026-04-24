// Run Better Auth schema migrations against MongoDB.
// Usage: node scripts/migrate.mjs
// Requires MONGODB_URI in .env.local (or environment).

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);

const fs = require("fs");
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key) process.env[key] = value;
  }
}

const uri = process.env.MONGODB_URI;
if (!uri?.trim()) {
  console.error("Missing MONGODB_URI. Add it to .env.local.");
  process.exit(1);
}

const { MongoClient } = await import("mongodb");
const { betterAuth } = await import("better-auth");
const { mongodbAdapter } = await import("better-auth/adapters/mongodb");

const client = new MongoClient(uri.trim());
await client.connect();
const db = client.db("tracktick");

const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: mongodbAdapter(db, { client }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
});

console.log("Running Better Auth migrations…");
const ctx = await auth.$context;
await ctx.runMigrations();
await client.close();
console.log("✅ Migration complete — Better Auth collections ready in MongoDB (database: tracktick)");
