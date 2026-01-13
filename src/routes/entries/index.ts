import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { database } from "@/db/client";
import { entries } from "@/db/schema";
import { createJwtMiddleware } from "@/middleware/auth";
import type { Bindings, EntriesListResponse } from "@/types";

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
  const db = database(c.env.DATABASE_URL);

  try {
    // Query all entries
    const results = await db.select().from(entries);

    // Transform to API response format
    // Convert Date objects to ISO 8601 strings
    const response: EntriesListResponse = results.map((entry) => ({
      id: entry.id,
      url: entry.url,
      createdAt: entry.createdAt.toISOString(),
    }));

    return c.json(response, 200);
  } catch {
    // Database errors should return 500 with JSON error response
    throw new HTTPException(500, {
      res: new Response(
        JSON.stringify({ message: "Failed to fetch entries from database" }),
        {
          headers: { "Content-Type": "application/json" },
        },
      ),
    });
  }
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
