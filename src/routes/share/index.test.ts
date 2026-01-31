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

  describe("Duplicate URL handling", () => {
    it("should return 'Already Saved' for duplicate URL", async () => {
      const testUrl = "https://share-test-duplicate.example.com/page";

      // 1回目: 新規保存
      const res1 = await app.request(
        `/share?url=${encodeURIComponent(testUrl)}`,
        {},
        env,
      );
      expect(res1.status).toBe(200);
      const html1 = await res1.text();
      expect(html1).toContain("Saved");
      expect(html1).not.toContain("Already Saved");

      // 2回目: 重複
      const res2 = await app.request(
        `/share?url=${encodeURIComponent(testUrl)}`,
        {},
        env,
      );
      expect(res2.status).toBe(200);
      const html2 = await res2.text();
      expect(html2).toContain("Already Saved");

      // DBに1件のみ保存されていることを確認
      const client = createDrizzleClient(env.DATABASE_URL);
      const saved = await client
        .select()
        .from(entries)
        .where(eq(entries.url, testUrl));
      expect(saved).toHaveLength(1);
    });

    it("should return 'Saved' for different URLs", async () => {
      const url1 = "https://share-test-unique1.example.com";
      const url2 = "https://share-test-unique2.example.com";

      const res1 = await app.request(
        `/share?url=${encodeURIComponent(url1)}`,
        {},
        env,
      );
      expect(res1.status).toBe(200);
      const html1 = await res1.text();
      expect(html1).toContain("Saved");
      expect(html1).not.toContain("Already Saved");

      const res2 = await app.request(
        `/share?url=${encodeURIComponent(url2)}`,
        {},
        env,
      );
      expect(res2.status).toBe(200);
      const html2 = await res2.text();
      expect(html2).toContain("Saved");
      expect(html2).not.toContain("Already Saved");
    });

    it("should detect duplicate when URL comes from text parameter", async () => {
      const testUrl = "https://share-test-dup-text.example.com";

      // 1回目: url パラメータで保存
      const res1 = await app.request(
        `/share?url=${encodeURIComponent(testUrl)}`,
        {},
        env,
      );
      expect(res1.status).toBe(200);
      const html1 = await res1.text();
      expect(html1).toContain("Saved");
      expect(html1).not.toContain("Already Saved");

      // 2回目: text パラメータ経由で同じURL
      const text = `Check this: ${testUrl}`;
      const res2 = await app.request(
        `/share?text=${encodeURIComponent(text)}`,
        {},
        env,
      );
      expect(res2.status).toBe(200);
      const html2 = await res2.text();
      expect(html2).toContain("Already Saved");

      // DBに1件のみ
      const client = createDrizzleClient(env.DATABASE_URL);
      const saved = await client
        .select()
        .from(entries)
        .where(eq(entries.url, testUrl));
      expect(saved).toHaveLength(1);
    });
  });
});
