import { z } from "zod";

export const songSchema = z.object({
  id: z.number(),
  title: z.string(),
  upvotes: z.number(),
  downvotes: z.number(),
});

export const commentSchema = z.object({
  id: z.number(),
  song_id: z.number(),
  text: z.string(),
  created_at: z.string(),
});

export const commentBodySchema = z.object({
  text: z.string().min(1).max(140),
});

export type Song = z.infer<typeof songSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type SongWithComments = Song & { comments: Comment[] };

export type WebSocketMessage =
  | { type: "update"; songId: number; data: SongWithComments }
  | { type: "error"; message: string };
