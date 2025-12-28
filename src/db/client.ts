import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

export function database(connectionString: string) {
  const pool = new Pool({ connectionString });
  const connectionStringUrl = new URL(connectionString);

  neonConfig.useSecureWebSocket =
    connectionStringUrl.hostname !== "db.localtest.me";
  neonConfig.wsProxy = (host) =>
    host === "db.localtest.me" ? `${host}:4444/v2` : `${host}/v2`;
  neonConfig.webSocketConstructor = ws;

  return drizzle({ client: pool });
}
