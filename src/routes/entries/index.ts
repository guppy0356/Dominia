import { Hono } from "hono";
import { createDrizzleClient } from "@/db/client";
import { entries } from "@/db/schema";
import { createJwtMiddleware } from "@/middleware/auth";
import * as EntrySchema from "@/routes/entries/schema";
import type { Bindings } from "@/types";

// Create sub-app with same Bindings type for proper type inference
const app = new Hono<{ Bindings: Bindings }>();

// Apply JWT authentication to all routes in this sub-app
app.use(createJwtMiddleware());

/**
 * GET / - List all entries
 * Protected by JWT authentication
 * Returns JSON array of entries with id, url, and createdAt (ISO 8601)
 *
 * @returns 200 - Array of entries
 * @throws 500 - Database connection or query failure
 */
app.get("/", async (c) => {
  const client = createDrizzleClient(c.env.DATABASE_URL);

  // Query all entries
  const entryCollection = await client.select().from(entries);
  const safeResponse = EntrySchema.collection.parse(entryCollection);

  return c.json(safeResponse, 200);
});

/**
 * Future routes (examples for planning):
 *
 * POST / - Create new entry
 * app.post("/", async (c) => {
 *   try {
 *     // Validate request body
 *     // Insert into database
 *     return c.json(newEntry, 201)
 *   } catch (error) {
 *     throw new HTTPException(400, {
 *       res: new Response(JSON.stringify({ message: 'Invalid request body' }), {
 *         headers: { 'Content-Type': 'application/json' }
 *       })
 *     })
 *   }
 * })
 *
 * GET /:id - Get single entry
 * app.get("/:id", async (c) => {
 *   const entry = await db.select()...
 *   if (!entry) {
 *     throw new HTTPException(404, {
 *       res: new Response(JSON.stringify({ message: 'Entry not found' }), {
 *         headers: { 'Content-Type': 'application/json' }
 *       })
 *     })
 *   }
 *   return c.json(entry, 200)
 * })
 *
 * PUT /:id - Update entry
 * app.put("/:id", async (c) => {
 *   // Similar to GET + POST patterns
 *   // 404 if not found, 400 for validation errors
 * })
 *
 * DELETE /:id - Delete entry
 * app.delete("/:id", async (c) => {
 *   // 404 if not found, 204 on success
 *   return c.body(null, 204)
 * })
 */

export default app;
