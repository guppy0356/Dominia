import { Hono } from 'hono'
import { renderer } from './renderer'
import type { Env } from './env'

const app = new Hono<{ Bindings: Env }>()

app.use(renderer)

app.get('/', (c) => {
  return c.render(<h1>Hello!{c.env.FULLNAME}</h1>)
})

export default app
