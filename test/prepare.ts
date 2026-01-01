import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const env = dotenv.config();
dotenvExpand.expand(env);

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not defined in environment variables");
}
const DB_NAMES = ["test_1", "test_2", "test_3", "test_4"];
const MIGRATIONS_FOLDER = "./src/db/migrations";

async function prepareTestDatabases() {
  console.log("Starting test database preparation...\n");

  console.log("Creating databases...");
  const adminSql = postgres(`${POSTGRES_URL}/postgres`);

  for (const dbName of DB_NAMES) {
    try {
      await adminSql.unsafe(`DROP DATABASE IF EXISTS ${dbName}`);
    } catch (error) {
      console.warn(
        `  Warning: Could not drop ${dbName}:`,
        (error as Error).message,
      );
    }

    await adminSql.unsafe(`CREATE DATABASE ${dbName}`);

    console.log(`✓ Created database: ${dbName}`);
  }

  await adminSql.end();

  console.log("\nApplying migrations...");

  for (const dbName of DB_NAMES) {
    const sql = postgres(`${POSTGRES_URL}/${dbName}`, { max: 1 });

    const db = drizzle(sql);

    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

    console.log(`✓ Applied migrations to: ${dbName}`);

    await sql.end();
  }
}

prepareTestDatabases()
  .then(() => {
    console.log("\n✓ All test databases prepared successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Failed to prepare test databases:", error);
    process.exit(1);
  });
