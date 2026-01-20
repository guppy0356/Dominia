import { z } from "zod";

/** HTTP(S) URL validator */
const httpUrl = z.string().refine((url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
});

/** Extract URL from text content */
const urlFromText = z
  .string()
  .transform((text) => text.match(/https?:\/\/[^\s]+/)?.[0] ?? "")
  .pipe(httpUrl);

/**
 * Share query schema
 * Priority: url > text (extract URL) > title
 * Uses .catch(undefined) to silently skip invalid values
 */
export const shareQuery = z
  .object({
    url: httpUrl.optional().catch(undefined),
    text: urlFromText.optional().catch(undefined),
    title: httpUrl.optional().catch(undefined),
  })
  .transform((data) => ({
    ...data,
    extractedUrl: data.url ?? data.text ?? data.title,
  }))
  .pipe(
    z.object({
      url: z.string().optional(),
      text: z.string().optional(),
      title: z.string().optional(),
      extractedUrl: z.string({ message: "No valid URL found" }),
    }),
  );
