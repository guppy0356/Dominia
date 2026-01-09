import type { Context } from "hono";
import { jwk } from "hono/jwk";
import type { Bindings } from "@/types";

/**
 * Creates JWT middleware with JWKS URI from environment
 * Can be applied to any Hono instance or specific routes
 */
export function createJwtMiddleware() {
  return jwk({
    jwks_uri: (c: Context<{ Bindings: Bindings }>) =>
      c.env.JWKS_URI ?? "https://keeplater.kinde.com/.well-known/jwks.json",
  });
}
