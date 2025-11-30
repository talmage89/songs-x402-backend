import {
  error,
  IttyRouter,
  type RequestHandler,
  withParams,
} from "itty-router";
import { getSongDoMeta, handler, SongsDoEndpoint } from "~/do/songs/endpoint";

type Endpoint = {
  method: string;
  path: string;
  handler: RequestHandler;
};

const apiEndpoints: Endpoint[] = [];

for (const endpoint of Object.values(SongsDoEndpoint)) {
  apiEndpoints.push({ ...getSongDoMeta(endpoint), handler });
}

const createRouter = () => {
  const router = IttyRouter();

  router.all("*", withParams);

  for (const endpoint of apiEndpoints) {
    const handler: RequestHandler = async (request, env) => {
      const data = await endpoint.handler(request, env);
      return data instanceof Response
        ? data
        : new Response(JSON.stringify(data));
    };
    router[endpoint.method](endpoint.path, handler);
  }

  router.all("*", () => error(404));

  return router;
};

export default createRouter();
