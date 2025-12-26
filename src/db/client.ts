import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

export function database(url: string) {
  neonConfig.fetchEndpoint = (host) => {
    const [protocol, port] = host === 'db.localtest.me' ? ['http', 4444] : ['https', 443];
    return `${protocol}://${host}:${port}/sql`;
  }

  return drizzle({ client: neon(url) })
}
