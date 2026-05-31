import { createClient } from "@libsql/client";
import "dotenv/config";

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function run() {
  try {
    console.log("Applying migrations to Turso database...");
    
    // Check if column exists first to be safe, although we know it doesn't
    try {
      await client.execute(`ALTER TABLE "SecuritySettings" ADD COLUMN "recoveryHash" TEXT;`);
      console.log("Added recoveryHash column.");
    } catch (e) {
      if (e.message.includes("duplicate column name")) {
        console.log("recoveryHash column already exists.");
      } else {
        throw e;
      }
    }
    
    try {
      await client.execute(`ALTER TABLE "SecuritySettings" ADD COLUMN "autoLockMinutes" INTEGER NOT NULL DEFAULT 15;`);
      console.log("Added autoLockMinutes column.");
    } catch (e) {
      if (e.message.includes("duplicate column name")) {
        console.log("autoLockMinutes column already exists.");
      } else {
        throw e;
      }
    }

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

run();
