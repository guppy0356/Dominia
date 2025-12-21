import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

let configured = false

export function database(url: string) {
  if (!configured) {
    const parsed = new URL(url.replace(/^postgres:\/\//, 'http://'))
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      neonConfig.fetchEndpoint = `http://${parsed.host}/sql`
      neonConfig.poolQueryViaFetch = true
    }
    configured = true
  }

  return drizzle({ client: neon(url) })
}
