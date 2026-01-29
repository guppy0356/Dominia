import { drizzle } from "drizzle-orm/postgres-js";
import { reset } from "drizzle-seed";
import postgres from "postgres";
import { envSchema } from "@/types";
import * as schema from "../src/db/schema";

async function truncate() {
  const env = envSchema.pick({ DATABASE_URL: true }).parse(process.env);
  const url = new URL(env.DATABASE_URL);
  const isLocal = url.hostname.endsWith(".localtest.me");
  const sslMode = isLocal ? false : "require";

  const client = postgres(env.DATABASE_URL, {
    ssl: sslMode,
    max: 1,
  });

  const db = drizzle(client, { schema });

  try {
    await reset(db, schema);
    console.log("✅ Tables truncated successfully.");
  } catch (error) {
    console.error("❌ Failed to truncate tables:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

truncate();
