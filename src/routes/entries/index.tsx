import { count } from "drizzle-orm";
import { Hono } from "hono";
import { database } from "@/db/client";
import { entries } from "@/db/schema";
import { createJwtMiddleware } from "@/middleware/auth";
import type { Bindings } from "@/types";

// Create sub-app with same Bindings type for proper type inference
const app = new Hono<{ Bindings: Bindings }>();

// Apply JWT authentication to all routes in this sub-app
app.use(createJwtMiddleware());

/**
 * GET / - List entries count (currently returns HTML)
 * Protected by JWT authentication
 */
app.get("/", async (c) => {
  const db = database(c.env.DATABASE_URL);
  const result = await db.select({ count: count() }).from(entries);
  const totalCount = result[0].count;

  return c.render(<h1>Entries: {totalCount}</h1>);
});

/**
 * Future routes (examples for planning):
 *
 * POST / - Create new entry
 * app.post("/", async (c) => { ... })
 *
 * GET /:id - Get single entry
 * app.get("/:id", async (c) => { ... })
 *
 * PUT /:id - Update entry
 * app.put("/:id", async (c) => { ... })
 *
 * DELETE /:id - Delete entry
 * app.delete("/:id", async (c) => { ... })
 */

export default app;
