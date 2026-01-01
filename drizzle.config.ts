import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { defineConfig } from "drizzle-kit";

const env = dotenv.config();
dotenvExpand.expand(env);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
