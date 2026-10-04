import { createClient } from "@libsql/client";
import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

if (!url || !url.startsWith("libsql://")) {
  console.error("❌ DATABASE_URL must start with libsql://");
  process.exit(1);
}

if (!authToken) {
  console.error("❌ DATABASE_AUTH_TOKEN is required for Turso connections.");
  process.exit(1);
}

console.log(`Connecting to Turso: ${url}...`);
const client = createClient({ url, authToken });

try {
  console.log("Generating schema SQL from Prisma datamodel...");
  const sql = execSync("npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script", {
    encoding: "utf-8",
  });

  console.log("Applying schema to Turso cloud database...");
  await client.executeMultiple(sql);

  console.log("Verifying created tables...");
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
  
  console.log("✅ Successfully initialized Turso cloud database!");
  console.log("Existing tables:", tables.rows.map(r => r.name).join(", "));
} catch (err) {
  console.error("❌ Error initializing Turso database:", err);
  process.exit(1);
}
