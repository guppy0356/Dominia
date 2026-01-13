import { env, fetchMock } from "cloudflare:test";
import { createJwtTestHelper, type JwtHelper } from "@test/helpers/jwt";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "@/index";
import type { Collection, ErrorResponse } from "@/routes/entries/schema";

describe("GET /entries", () => {
  describe("without authentication", () => {
    it("should return 401 without authorization header", async () => {
      const res = await app.request("/entries", {}, env);
      expect(res.status).toBe(401);
    });
  });

  describe("with valid authentication", () => {
    let jwtHelper: JwtHelper;

    beforeAll(async () => {
      jwtHelper = await createJwtTestHelper();
    });

    beforeEach(() => {
      fetchMock.activate();
      fetchMock.disableNetConnect();
      fetchMock.enableNetConnect(/db\.localtest\.me:4444/);

      const jwksUrl = new URL(env.JWKS_URI);
      fetchMock
        .get(jwksUrl.origin)
        .intercept({ path: jwksUrl.pathname })
        .reply(200, { keys: [jwtHelper.publicJwk] });
    });

    afterEach(() => {
      fetchMock.assertNoPendingInterceptors();
      fetchMock.deactivate();
    });

    it("should return 200 with JSON array", async () => {
      const token = await jwtHelper.createToken();
      const res = await app.request(
        "/entries",
        { headers: { Authorization: `Bearer ${token}` } },
        env,
      );

      // Verify status and content type
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/json");

      // Verify response structure
      const data = (await res.json()) as Collection;
      expect(Array.isArray(data)).toBe(true);

      // Verify entry structure if data exists
      if (data.length > 0) {
        const firstEntry = data[0];
        expect(firstEntry).toHaveProperty("id");
        expect(firstEntry).toHaveProperty("url");
        expect(firstEntry).toHaveProperty("createdAt");
        expect(typeof firstEntry.id).toBe("string");
        expect(typeof firstEntry.url).toBe("string");
        expect(typeof firstEntry.createdAt).toBe("string");
        // Verify ISO 8601 format
        expect(() => new Date(firstEntry.createdAt)).not.toThrow();
      }
    });

    it("should return 500 on database error", async () => {
      const token = await jwtHelper.createToken();

      // Use invalid DATABASE_URL to simulate connection failure
      const invalidEnv = {
        ...env,
        DATABASE_URL: "postgresql://invalid:invalid@localhost:9999/nonexistent",
      };

      const res = await app.request(
        "/entries",
        { headers: { Authorization: `Bearer ${token}` } },
        invalidEnv,
      );

      expect(res.status).toBe(500);
      expect(res.headers.get("content-type")).toContain("application/json");

      const errorData = (await res.json()) as ErrorResponse;
      expect(errorData).toHaveProperty("message");
      expect(typeof errorData.message).toBe("string");
    });
  });
});
