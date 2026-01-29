import { getTableName, is, sql } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { envSchema } from "@/types";
import * as schema from "../src/db/schema";

async function clean() {
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
    // Extract table names from schema
    const tables = Object.values(schema).filter((value) => is(value, PgTable));
    const tableNames = tables.map((table) => getTableName(table));

    console.log(`🔄 Dropping tables: ${tableNames.join(", ")}`);

    // Drop tables with CASCADE
    for (const tableName of tableNames) {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE`));
      console.log(`   ✓ Dropped table: ${tableName}`);
    }

    // Truncate migrations table in drizzle schema
    console.log("🔄 Truncating drizzle.__drizzle_migrations...");
    try {
      await db.execute(sql.raw("TRUNCATE TABLE drizzle.__drizzle_migrations"));
      console.log("   ✓ Truncated drizzle.__drizzle_migrations");
    } catch {
      console.log(
        "   ⚠️  drizzle.__drizzle_migrations table doesn't exist (skipping)",
      );
    }

    console.log("✅ Database cleaned successfully");
  } catch (error) {
    console.error("❌ Failed to clean database:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

clean();
