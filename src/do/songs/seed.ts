import type { Song } from "~/types";

export const data: Omit<Song, "id">[] = [
  {
    title: "Hello, Cloudflare",
    upvotes: 10,
    downvotes: 1,
  },
  {
    title: "Durable Dreams",
    upvotes: 25,
    downvotes: 3,
  },
  {
    title: "Songs x402",
    upvotes: 42,
    downvotes: 0,
  },
];
