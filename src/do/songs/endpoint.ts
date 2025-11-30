import type { RequestHandler } from "itty-router";
import { SONGS_DO_STORAGE_KEY } from "./songs";

export enum SongsDoEndpoint {
  LIST = "list",
  UPVOTE = "upvote",
  DOWNVOTE = "downvote",
}

export const getSongDoMeta = (endpoint: SongsDoEndpoint) => {
  const meta = {
    [SongsDoEndpoint.LIST]: {
      method: "GET",
      path: "/d/list",
      matcher: /\/d\/list/,
    },
    [SongsDoEndpoint.UPVOTE]: {
      method: "POST",
      path: "/d/:id/up",
      matcher: /\/d\/(\d+)\/up/,
    },
    [SongsDoEndpoint.DOWNVOTE]: {
      method: "POST",
      path: "/d/:id/down",
      matcher: /\/d\/(\d+)\/down/,
    },
  };

  return meta[endpoint];
};

export const handler: RequestHandler = async (request, env) => {
  const url = new URL(request.url);

  const id = env.SONGS.idFromName(SONGS_DO_STORAGE_KEY);
  const stub = env.SONGS.get(id);

  const endpoint = Object.values(SongsDoEndpoint).find((key: SongsDoEndpoint) =>
    getSongDoMeta(key).matcher.test(url.pathname),
  );

  switch (endpoint) {
    case SongsDoEndpoint.LIST:
      return stub.list();
    case SongsDoEndpoint.UPVOTE:
      return stub.upvote(Number(request.params.id));
    case SongsDoEndpoint.DOWNVOTE:
      return stub.downvote(Number(request.params.id));
  }
};
