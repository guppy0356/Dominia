import { defineConfig } from "drizzle-kit";
import { envSchema } from "@/types";

const env = envSchema.pick({ DATABASE_URL: true }).parse(process.env);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL ?? "",
  },
});
