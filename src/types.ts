import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.url(),
  JWKS_URI: z.url(),
});

export type Bindings = z.infer<typeof envSchema>;
