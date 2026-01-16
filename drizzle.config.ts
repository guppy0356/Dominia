import { defineConfig } from "drizzle-kit";
import { parseEnv } from "@/types";

const env = parseEnv(process.env);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL ?? "",
  },
});
