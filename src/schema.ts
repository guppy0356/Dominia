import { z } from "zod";

// Unhandled error (500) response schema - RFC 9457 Problem Details
export const internalServerErrorResponse = z.object({
  type: z.literal("about:blank"),
  title: z.literal("Internal Server Error"),
  status: z.literal(500),
});

export type InternalServerErrorResponse = z.infer<
  typeof internalServerErrorResponse
>;
