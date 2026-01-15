import { env } from "cloudflare:test";
import { authenticated } from "@test/helpers/jwt";
import { describe, expect, it } from "vitest";
import app from "@/index";
import { collection } from "@/routes/entries/schema";

describe("GET /entries", () => {
  it("should return 401 without authentication", async () => {
    const res = await app.request("/entries", {}, env);
    expect(res.status).toBe(401);
  });

  it("should return 200 with JSON array when authenticated", async () => {
    await authenticated(async (token) => {
      const res = await app.request(
        "/entries",
        { headers: { Authorization: `Bearer ${token}` } },
        env,
      );

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/json");

      const data = collection.parse(await res.json());
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
