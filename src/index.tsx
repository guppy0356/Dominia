import { Hono } from 'hono'
import { renderer } from './renderer'
import type { Bindings } from './types'
import { count } from 'drizzle-orm'
import { entries } from './db/schema'
import { database } from './db/client'

const app = new Hono<{ Bindings: Bindings }>()

app.use(renderer)

app.get('/', (c) => {
  return c.render(<h1>Hello!{c.env.FULLNAME}</h1>)
})

app.get('/entries', async (c) => {
  const db = database(c.env.DATABASE_URL)
  const result = await db.select({ count: count() }).from(entries)
  const totalCount = result[0].count

  return c.render(<h1>Entries: {totalCount}</h1>)
})

export default app
