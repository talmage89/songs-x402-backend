import { z } from "zod";

export const songSchema = z.object({
  id: z.number(),
  title: z.string(),
  upvotes: z.number(),
  downvotes: z.number(),
});

export type Song = z.infer<typeof songSchema>;
