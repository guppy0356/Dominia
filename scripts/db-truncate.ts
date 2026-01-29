import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { drizzle } from "drizzle-orm/postgres-js";
import { reset } from "drizzle-seed";
import postgres from "postgres";
import * as schema from "../src/db/schema";

const isTest = process.argv.includes("--env=test");
const envPath = isTest ? ".env.test" : ".env";
const env: Record<string, string> = {};
const parsed = dotenv.config({ path: envPath, processEnv: env });
dotenvExpand.expand({ ...parsed, processEnv: env });

async function main() {
  if (!env.DATABASE_URL) {
    throw new Error(`DATABASE_URL not found in ${envPath}`);
  }

  console.log(`🧹 Truncating tables in ${isTest ? "TEST" : "DEV"} DB...`);

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

main();
