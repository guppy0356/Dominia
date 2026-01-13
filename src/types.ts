import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  JWKS_URI: z.url(),
});

export type Bindings = z.infer<typeof envSchema>;

export function parseEnv(env: unknown): Bindings {
  return envSchema.parse(env);
}

// Response Schemas for API endpoints
export const EntryResponseSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  createdAt: z.string().datetime(),
});

export const EntriesListResponseSchema = z.array(EntryResponseSchema);

export const ErrorResponseSchema = z.object({
  message: z.string(),
});

// Export inferred types
export type EntryResponse = z.infer<typeof EntryResponseSchema>;
export type EntriesListResponse = z.infer<typeof EntriesListResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
