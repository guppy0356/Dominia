import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@/db/schema";

export function createDrizzleClient(connectionString: string) {
  const pool = new Pool({ connectionString });
  const connectionStringUrl = new URL(connectionString);

  const isLocal = (hostname: string) => hostname.endsWith(".localtest.me");

  neonConfig.useSecureWebSocket =
    isLocal(connectionStringUrl.hostname) === false;
  neonConfig.wsProxy = (host) =>
    isLocal(host) ? `${host}:4444/v2` : `${host}/v2`;
  neonConfig.webSocketConstructor = ws;

  return drizzle(pool, { schema: schema });
}
