import { error, type RequestHandler } from "itty-router";
import { commentBodySchema } from "~/types";
import { SONGS_DO_STORAGE_KEY } from "./songs";

export enum SongsDoEndpoint {
  LIST = "list",
  DETAIL = "detail",
  UPVOTE = "upvote",
  DOWNVOTE = "downvote",
  COMMENT = "comment",
  WEBSOCKET = "websocket",
}

export const getSongDoMeta = (endpoint: SongsDoEndpoint) => {
  const meta = {
    [SongsDoEndpoint.LIST]: {
      method: "get",
      path: "/d/list",
      matcher: /^\/d\/list$/,
    },
    [SongsDoEndpoint.DETAIL]: {
      method: "get",
      path: "/d/:id",
      matcher: /^\/d\/(\d+)$/,
    },
    [SongsDoEndpoint.UPVOTE]: {
      method: "post",
      path: "/d/:id/up",
      matcher: /^\/d\/(\d+)\/up$/,
    },
    [SongsDoEndpoint.DOWNVOTE]: {
      method: "post",
      path: "/d/:id/down",
      matcher: /^\/d\/(\d+)\/down$/,
    },
    [SongsDoEndpoint.COMMENT]: {
      method: "post",
      path: "/d/:id/comment",
      matcher: /^\/d\/(\d+)\/comment$/,
    },
    [SongsDoEndpoint.WEBSOCKET]: {
      method: "get",
      path: "/d/:id/ws",
      matcher: /^\/d\/(\d+)\/ws$/,
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
    case SongsDoEndpoint.DETAIL:
      return stub.detail(Number(request.params.id));
    case SongsDoEndpoint.UPVOTE:
      return stub.upvote(Number(request.params.id));
    case SongsDoEndpoint.DOWNVOTE:
      return stub.downvote(Number(request.params.id));
    case SongsDoEndpoint.COMMENT: {
      try {
        const { text } = commentBodySchema.parse(await request.json());
        return stub.comment(Number(request.params.id), text);
      } catch {
        return error(400);
      }
    }
    case SongsDoEndpoint.WEBSOCKET: {
      const upgradeHeader = request.headers.get("Upgrade");
      if (!upgradeHeader || upgradeHeader !== "websocket") {
        return new Response("Worker expected Upgrade: websocket", {
          status: 426,
        });
      }

      return await stub.fetch(request.clone());
    }
  }
};
