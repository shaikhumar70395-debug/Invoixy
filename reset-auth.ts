import { createClient } from "@libsql/client";

async function resetAuth() {
  const url = process.env.DATABASE_URL || "file:./dev.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

  console.log(`Connecting to database at ${url}...`);

  const client = createClient({ url, authToken });

  try {
    // Attempt to delete all rows from SecuritySettings
    await client.execute("DELETE FROM SecuritySettings");
    console.log("Auth settings successfully wiped! You can now set up your new 6-digit PIN on the login screen.");
  } catch (error: any) {
    if (error.message.includes("no such table")) {
      console.log("The SecuritySettings table doesn't exist yet! This means you have no PIN set up at all, so you are already good to go.");
    } else {
      console.error("Error resetting auth:", error.message);
    }
  } finally {
    client.close();
  }
}

resetAuth();
