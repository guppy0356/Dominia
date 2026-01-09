import { env, fetchMock } from "cloudflare:test";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "@/index";
import { type AuthTools, createAuthTools } from "./helpers/jwt";

const TEST_JWKS_HOST = "https://test-jwks.local";

const createTestEnv = () => ({
  ...env,
  JWKS_URI: `${TEST_JWKS_HOST}/.well-known/jwks.json`,
});

describe("GET /entries", () => {
  describe("without authentication", () => {
    it("should return 401 without authorization header", async () => {
      const res = await app.request("/entries", {}, createTestEnv());
      expect(res.status).toBe(401);
    });
  });

  describe("with valid authentication", () => {
    let auth: AuthTools;

    beforeAll(async () => {
      auth = await createAuthTools();
    });

    beforeEach(() => {
      fetchMock.activate();
      fetchMock.disableNetConnect();
      fetchMock.enableNetConnect(/db\.localtest\.me:4444/);

      fetchMock
        .get(TEST_JWKS_HOST)
        .intercept({ path: "/.well-known/jwks.json" })
        .reply(200, { keys: [auth.publicJwk] });
    });

    afterEach(() => {
      fetchMock.assertNoPendingInterceptors();
      fetchMock.deactivate();
    });

    it("should return 200 with valid JWT", async () => {
      const token = await auth.createToken();
      const res = await app.request(
        "/entries",
        { headers: { Authorization: `Bearer ${token}` } },
        createTestEnv(),
      );

      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("Entries:");
      expect(html).toMatch(/Entries:\s*\d+/);
    });
  });
});
