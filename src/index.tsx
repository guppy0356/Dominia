import { count } from "drizzle-orm";
import { Hono } from "hono";
import { jwk } from "hono/jwk";
import { database } from "./db/client";
import { entries } from "./db/schema";
import { renderer } from "./renderer";
import type { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();

app.use(renderer);
app.use(
  "/entries",
  jwk({
    jwks_uri: (c) =>
      c.env.JWKS_URI ?? "https://keeplater.kinde.com/.well-known/jwks.json",
  }),
);

app.get("/entries", async (c) => {
  const db = database(c.env.DATABASE_URL);
  const result = await db.select({ count: count() }).from(entries);
  const totalCount = result[0].count;

  return c.render(<h1>Entries: {totalCount}</h1>);
});

export default app;
