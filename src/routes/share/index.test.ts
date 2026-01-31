import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { reset } from "drizzle-seed";
import { beforeEach, describe, expect, it } from "vitest";
import { createDrizzleClient } from "@/db/client";
import { entries } from "@/db/schema";
import app from "@/index";

describe("GET /share", () => {
  beforeEach(async () => {
    // Reset before each test to handle test interleaving from vitest-pool-workers
    const client = createDrizzleClient(env.DATABASE_URL);
    await reset(client, { entries });
  });

  describe("URL extraction", () => {
    it("should save URL from url parameter", async () => {
      const testUrl = "https://share-test-url-param.example.com/page";
      const res = await app.request(
        `/share?url=${encodeURIComponent(testUrl)}`,
        {},
        env,
      );

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/html");

      const html = await res.text();
      expect(html).toContain("Saved");
      expect(html).toContain("share-test-url-param.example.com");

      // Verify entry was saved by querying for the specific URL
      const client = createDrizzleClient(env.DATABASE_URL);
      const saved = await client
        .select()
        .from(entries)
        .where(eq(entries.url, testUrl));
      expect(saved).toHaveLength(1);
      expect(saved[0].url).toBe(testUrl);
    });

    it("should extract URL from text parameter", async () => {
      const expectedUrl = "https://share-test-text-extract.example.com/article";
      const text = `Check this out: ${expectedUrl} some more text`;
      const res = await app.request(
        `/share?text=${encodeURIComponent(text)}`,
        {},
        env,
      );

      expect(res.status).toBe(200);

      const client = createDrizzleClient(env.DATABASE_URL);
      const saved = await client
        .select()
        .from(entries)
        .where(eq(entries.url, expectedUrl));
      expect(saved).toHaveLength(1);
      expect(saved[0].url).toBe(expectedUrl);
    });

    it("should use title as URL fallback", async () => {
      const title = "https://share-test-title-fallback.example.com/title-url";
      const res = await app.request(
        `/share?title=${encodeURIComponent(title)}`,
        {},
        env,
      );

      expect(res.status).toBe(200);

      const client = createDrizzleClient(env.DATABASE_URL);
      const saved = await client
        .select()
        .from(entries)
        .where(eq(entries.url, title));
      expect(saved).toHaveLength(1);
      expect(saved[0].url).toBe(title);
    });

    it("should prioritize url over text", async () => {
      const url = "https://share-test-priority-url.example.com";
      const text = "https://share-test-secondary.example.com in text";
      const res = await app.request(
        `/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        {},
        env,
      );

      expect(res.status).toBe(200);

      const client = createDrizzleClient(env.DATABASE_URL);
      const saved = await client
        .select()
        .from(entries)
        .where(eq(entries.url, url));
      expect(saved).toHaveLength(1);
      expect(saved[0].url).toBe(url);
    });

    it("should prioritize text over title", async () => {
      const text = "https://share-test-text-priority.example.com";
      const title = "https://share-test-title-ignored.example.com";
      const res = await app.request(
        `/share?text=${encodeURIComponent(text)}&title=${encodeURIComponent(title)}`,
        {},
        env,
      );

      expect(res.status).toBe(200);

      const client = createDrizzleClient(env.DATABASE_URL);
      const saved = await client
        .select()
        .from(entries)
        .where(eq(entries.url, text));
      expect(saved).toHaveLength(1);
      expect(saved[0].url).toBe(text);
    });
  });

  describe("Error handling", () => {
    it("should return 400 when no valid URL found", async () => {
      const res = await app.request("/share", {}, env);

      expect(res.status).toBe(400);
      expect(res.headers.get("content-type")).toContain("text/html");

      const html = await res.text();
      expect(html).toContain("Error");
      expect(html).toContain("No valid URL found");
    });

    it("should return 400 for invalid URL in url parameter", async () => {
      const res = await app.request("/share?url=not-a-url", {}, env);

      expect(res.status).toBe(400);
    });

    it("should return 400 for text without URL", async () => {
      const res = await app.request("/share?text=just+some+text", {}, env);

      expect(res.status).toBe(400);
    });

    it("should return 400 for non-http URL", async () => {
      const res = await app.request("/share?url=ftp://example.com", {}, env);

      expect(res.status).toBe(400);
    });
  });

  describe("XSS prevention", () => {
    it("should escape HTML in success response", async () => {
      const maliciousUrl =
        "https://share-test-xss.example.com/<script>alert('xss')</script>";
      const res = await app.request(
        `/share?url=${encodeURIComponent(maliciousUrl)}`,
        {},
        env,
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    });
  });

  describe("No authentication required", () => {
    it("should work without Authorization header", async () => {
      const res = await app.request(
        "/share?url=https://share-test-no-auth.example.com",
        {},
        env,
      );

      expect(res.status).toBe(200);
    });
  });
});
