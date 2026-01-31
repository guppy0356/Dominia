import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { html } from "hono/html";
import { createDrizzleClient } from "@/db/client";
import { entries } from "@/db/schema";
import type { Bindings } from "@/types";
import { shareQuery } from "./schema";

const app = new Hono<{ Bindings: Bindings }>();

/**
 * GET / - Handle PWA share_target
 * No JWT authentication required
 * Saves shared URL to entries table and returns HTML response
 */
app.get(
  "/",
  zValidator("query", shareQuery, (result, c) => {
    if (!result.success) {
      return c.html(
        html`<!doctype html><html><body><h1>Error</h1><p>No valid URL found</p></body></html>`,
        400,
      );
    }
  }),
  async (c) => {
    const { extractedUrl } = c.req.valid("query");
    const client = createDrizzleClient(c.env.DATABASE_URL);

    const existing = await client
      .select({ id: entries.id })
      .from(entries)
      .where(eq(entries.url, extractedUrl))
      .limit(1);

    if (existing.length > 0) {
      return c.html(
        html`<!doctype html><html><body><h1>Already Saved</h1><p>${extractedUrl}</p></body></html>`,
        200,
      );
    }

    await client.insert(entries).values({ url: extractedUrl });
    return c.html(
      html`<!doctype html><html><body><h1>Saved</h1><p>${extractedUrl}</p></body></html>`,
      200,
    );
  },
);

export default app;
