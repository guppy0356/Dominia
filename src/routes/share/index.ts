import { Hono } from "hono";
import { html } from "hono/html";
import { createDrizzleClient } from "@/db/client";
import { entries } from "@/db/schema";
import type { Bindings } from "@/types";

const app = new Hono<{ Bindings: Bindings }>();

/**
 * Extract URL from share_target parameters
 * Priority: url > text (extract URL) > title
 */
function extractUrl(
  url: string | undefined,
  text: string | undefined,
  title: string | undefined,
): string | null {
  // 1. Direct URL parameter
  if (url && isValidUrl(url)) {
    return url;
  }

  // 2. Extract URL from text
  if (text) {
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (urlMatch && isValidUrl(urlMatch[0])) {
      return urlMatch[0];
    }
  }

  // 3. Title as URL fallback
  if (title && isValidUrl(title)) {
    return title;
  }

  return null;
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * GET / - Handle PWA share_target
 * No JWT authentication required
 * Saves shared URL to entries table and returns HTML response
 */
app.get("/", async (c) => {
  const urlParam = c.req.query("url");
  const textParam = c.req.query("text");
  const titleParam = c.req.query("title");

  const extractedUrl = extractUrl(urlParam, textParam, titleParam);

  if (!extractedUrl) {
    return c.html(
      html`<!doctype html><html><body><h1>Error</h1><p>No valid URL found</p></body></html>`,
      400,
    );
  }

  const client = createDrizzleClient(c.env.DATABASE_URL);
  await client.insert(entries).values({ url: extractedUrl });

  return c.html(
    html`<!doctype html><html><body><h1>Saved</h1><p>${extractedUrl}</p></body></html>`,
    200,
  );
});

export default app;
