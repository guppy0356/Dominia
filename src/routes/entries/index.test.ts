import { env, fetchMock } from "cloudflare:test";
import { createJwtTestHelper, type JwtHelper } from "@test/helpers/jwt";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "@/index";
import { collection } from "@/routes/entries/schema";

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

      // Verify response structure using Zod schema
      const data = collection.parse(await res.json());
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
