import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@/db/schema";

export function createDrizzleClient(connectionString: string) {
  const connectionStringUrl = new URL(connectionString);
  const isLocal = connectionStringUrl.hostname.endsWith(".localtest.me");

  if (isLocal) {
    // Local: WebSocket via proxy
    neonConfig.wsProxy = (host) => `${host}:4444/v2`;
    neonConfig.useSecureWebSocket = false;
    neonConfig.pipelineTLS = false;
    neonConfig.pipelineConnect = false;
  }
  // CI/Production: Use default Neon WebSocket connection

  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}
