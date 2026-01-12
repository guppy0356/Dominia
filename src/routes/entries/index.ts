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
 * GET / - List all entries
 * Protected by JWT authentication
 * Returns JSON array of entries with id, url, and createdAt (ISO 8601)
 */
app.get("/", async (c) => {
  const db = database(c.env.DATABASE_URL);

  // Query all entries
  const results = await db.select().from(entries);

  // Transform to API response format
  // Convert Date objects to ISO 8601 strings
  const response = results.map((entry) => ({
    id: entry.id,
    url: entry.url,
    createdAt: entry.createdAt.toISOString(),
  }));

  return c.json(response);
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
