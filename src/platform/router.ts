import { error, IttyRouter, withParams } from "itty-router";
import songsDo from "~/endpoints/do";
import down from "~/endpoints/down";
import up from "~/endpoints/up";
import { getSongDoMeta, SongsDoEndpoint } from "./do";

type Handler = (request: Request, env: Env) => Response | Promise<Response>;

type Endpoint = {
  method: string;
  path: string;
  handler: Handler;
};

const withErrorHandling = (handler: Handler): Handler => {
  return async (request: Request, env: Env) => {
    try {
      return await handler(request, env);
    } catch (err) {
      const statusCode =
        err && typeof err === "object" && "statusCode" in err
          ? (err.statusCode as number)
          : 500;
      const message =
        err instanceof Error ? err.message : "Internal Server Error";
      return error(statusCode, message);
    }
  };
};

const apiEndpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/up",
    handler: up,
  },
  {
    method: "GET",
    path: "/down",
    handler: down,
  },
];

for (const endpoint of Object.values(SongsDoEndpoint)) {
  const meta = getSongDoMeta(endpoint);

  apiEndpoints.push({
    method: meta.method,
    path: meta.path,
    handler: songsDo,
  });
}

const createRouter = () => {
  const router = IttyRouter();

  router.all("*", withParams);

  for (const endpoint of apiEndpoints) {
    router[endpoint.method](endpoint.path, withErrorHandling(endpoint.handler));
  }

  router.all("*", () => error(404));

  return router;
};

export default createRouter();
