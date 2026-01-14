import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { getTableName, is, sql } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { createDrizzleClient } from "../src/db/client";
import * as schema from "../src/db/schema";

function loadEnv(isTest: boolean): string {
  const envPath = isTest ? ".env.test" : ".env";

  const env: Record<string, string> = {};
  const parsed = dotenv.config({ path: envPath, processEnv: env });
  dotenvExpand.expand({ ...parsed, processEnv: env });

  if (!env.DATABASE_URL) {
    throw new Error(`DATABASE_URL not found in ${envPath}`);
  }

  return env.DATABASE_URL;
}

async function cleanDatabase(databaseUrl: string) {
  const client = createDrizzleClient(databaseUrl);

  // Extract table names from schema
  const tables = Object.values(schema).filter((value) => is(value, PgTable));
  const tableNames = tables.map((table) => getTableName(table));

  console.log(`🔄 Dropping tables: ${tableNames.join(", ")}`);

  // Drop tables with CASCADE
  for (const tableName of tableNames) {
    await client.execute(
      sql.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE`),
    );
    console.log(`   ✓ Dropped table: ${tableName}`);
  }

  // Truncate migrations table in drizzle schema
  console.log("🔄 Truncating drizzle.__drizzle_migrations...");
  try {
    await client.execute(
      sql.raw("TRUNCATE TABLE drizzle.__drizzle_migrations"),
    );
    console.log("   ✓ Truncated drizzle.__drizzle_migrations");
  } catch {
    console.log(
      "   ⚠️  drizzle.__drizzle_migrations table doesn't exist (skipping)",
    );
  }

  console.log("✅ Database cleaned successfully");
}

async function clean(isTest: boolean) {
  const envName = isTest ? "TEST" : "DEV";

  console.log(`⚠️  WARNING: This will DROP all tables in ${envName} database`);
  console.log("");

  try {
    const databaseUrl = loadEnv(isTest);
    await cleanDatabase(databaseUrl);
  } catch (error) {
    console.error("❌ Failed to clean database:");
    console.error(error);
    process.exit(1);
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const isTest = args.includes("--env=test");

clean(isTest);
