import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { entries } from "@/db/schema";

// Generate base schema from Drizzle table definition
const selectSchema = createSelectSchema(entries);

// Extend the base schema with additional validation rules
// Ensures the url field is a valid URL format
export const entry = selectSchema.extend({
  url: z.url(),
});

// Schema for validating an array of entries
export const collection = z.array(entry);

// Export inferred types for use throughout the application
export type Entry = z.infer<typeof entry>;
export type Collection = z.infer<typeof collection>;

// Error response schema for API errors
export const errorResponse = z.object({
  message: z.string(),
});

export type ErrorResponse = z.infer<typeof errorResponse>;
