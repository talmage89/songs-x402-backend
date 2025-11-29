import { z } from "zod";
import { data } from "~/seed";
import { type Song, songSchema } from "~/types";

export const SONGS_DO_STORAGE_KEY = "songs";

export enum SongsDoEndpoint {
  ALL = "all",
  SEED = "seed",
}

export const getSongDoMeta = (endpoint: SongsDoEndpoint) => {
  const meta = {
    [SongsDoEndpoint.ALL]: {
      method: "GET",
      path: "/d/all",
    },
    [SongsDoEndpoint.SEED]: {
      method: "POST",
      path: "/d/seed",
    },
  };

  return meta[endpoint];
};

export class Songs {
  #state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.#state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case getSongDoMeta(SongsDoEndpoint.ALL).path:
        return this.#handleAll();
      case getSongDoMeta(SongsDoEndpoint.SEED).path:
        return this.#handleSeed();
      default:
        return this.response("Not found", 404);
    }
  }

  async #handleAll(): Promise<Response> {
    const stored =
      (await this.#state.storage.get<unknown>(SONGS_DO_STORAGE_KEY)) ?? [];

    const parsed = z.array(songSchema).safeParse(stored);
    const songs: Song[] = parsed.success ? parsed.data : [];

    if (!parsed.success) {
      await this.#state.storage.put(SONGS_DO_STORAGE_KEY, []);
    }

    return this.response(songs);
  }

  async #handleSeed(): Promise<Response> {
    const parsed = z.array(songSchema).safeParse(data);

    if (!parsed.success) {
      return new Response("Invalid seed data", { status: 500 });
    }

    await this.#state.storage.put(SONGS_DO_STORAGE_KEY, parsed.data);

    return this.response(parsed.data);
  }

  private response(data: unknown, status: number = 200): Response {
    const headers = {
      "Content-Type": "application/json",
    };

    return new Response(JSON.stringify(data), { headers, status });
  }
}
