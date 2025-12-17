import { z } from "zod";

const envSchema = z.object({
  FULLNAME: z.string(),
});

export type Env = z.infer<typeof envSchema>;
