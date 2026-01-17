import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@/db/schema";

export function createDrizzleClient(connectionString: string) {
  const connectionStringUrl = new URL(connectionString);
  const isLocal = connectionStringUrl.hostname.endsWith(".localtest.me");

  // 接続先に応じたプロキシ設定
  if (isLocal) {
    neonConfig.wsProxy = (host) => `${host}:4444/v2`;
    neonConfig.useSecureWebSocket = false;
    neonConfig.pipelineTLS = false;
    neonConfig.pipelineConnect = false;
  } else {
    neonConfig.wsProxy = (host) => `${host}/v2`;
    neonConfig.useSecureWebSocket = true;
    neonConfig.poolQueryViaFetch = true;
  }

  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}
