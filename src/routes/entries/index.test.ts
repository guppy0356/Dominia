import { env } from "cloudflare:test";
import { faker } from "@faker-js/faker";
import {
  authenticated,
  disableDbConnect,
  enableDbConnect,
} from "@test/helpers/jwt";
import { reset, seed } from "drizzle-seed";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDrizzleClient } from "@/db/client";
import { entries } from "@/db/schema";
import app from "@/index";
import type { Collection } from "@/routes/entries/schema";

describe("GET /entries", () => {
  beforeEach(async () => {
    enableDbConnect();
    const client = createDrizzleClient(env.DATABASE_URL);

    await seed(
      client,
      { entries },
      {
        count: 5,
      },
    ).refine((f) => ({
      entries: {
        columns: {
          id: f.valuesFromArray({
            values: Array.from({ length: 10 }, () => faker.string.uuid()),
            isUnique: true,
          }),
          url: f.valuesFromArray({
            values: Array.from({ length: 10 }, () => faker.internet.url()),
          }),
        },
      },
    }));
    disableDbConnect();
  });

  afterEach(async () => {
    enableDbConnect();
    const client = createDrizzleClient(env.DATABASE_URL);
    await reset(client, { entries });
    disableDbConnect();
  });

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

      const data = (await res.json()) as Collection;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(5);
    });
  });
});
