// Migration script — run once to create the SQLite tables
// Usage: node scripts/migrate.mjs

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);

// Load env vars manually
const fs = require("fs");
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
}

const Database = require("better-sqlite3");
const { betterAuth } = await import("better-auth");

const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: new Database("./local.db"),
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
console.log("✅ Migration complete — tables created in local.db");
