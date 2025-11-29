import { UnauthorizedError } from "~/errors";
import {
  getSongDoMeta,
  SONGS_DO_STORAGE_KEY,
  SongsDoEndpoint,
} from "~/platform/do";

export default async (request: Request, env: Env) => {
  const url = new URL(request.url);

  if (url.pathname === getSongDoMeta(SongsDoEndpoint.SEED).path) {
    authorize(request, env);
  }

  const id = env.SONGS.idFromName(SONGS_DO_STORAGE_KEY);
  const stub = env.SONGS.get(id);

  return stub.fetch(request.clone());
};

const authorize = (request: Request, env: Env) => {
  const authHeader = request.headers.get("Authorization");
  const expected = `Bearer ${env.SEED_AUTH_TOKEN}`;

  if (authHeader !== expected) {
    throw new UnauthorizedError();
  }
};
