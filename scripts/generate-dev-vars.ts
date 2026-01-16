import fs from "node:fs";
import dotenv from "dotenv";
import { expand } from "dotenv-expand";
import { z } from "zod";
import { envSchema } from "../src/types";

function generateDevVars(envPath: string, outputPath: string) {
  // Create a clean environment for this file
  const processEnv: Record<string, string> = {};
  const envConfig = dotenv.config({ path: envPath, processEnv });
  expand({ ...envConfig, processEnv });

  try {
    console.log(`🔄 Syncing ${envPath} to ${outputPath}...`);

    const parsedEnv = envSchema.parse(processEnv);

    const devVarsContent = Object.entries(parsedEnv)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    fs.writeFileSync(outputPath, devVarsContent);

    console.log(`✅ ${outputPath} generated successfully based on Zod schema.`);
    console.log("   Included keys:", Object.keys(parsedEnv).join(", "));
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`❌ Environment validation failed for ${envPath}:`);
      error.issues.forEach((err) => {
        console.error(`   - ${err.path.join(".")}: ${err.message}`);
      });
    } else {
      console.error(`❌ An unexpected error occurred for ${envPath}:`, error);
    }
    process.exit(1);
  }
}

// Generate .dev.vars from .env
generateDevVars(".env", ".dev.vars");

// Generate .dev.vars.test from .env.test
generateDevVars(".env.test", ".dev.vars.test");
