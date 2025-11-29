import { error, json } from "itty-router";
import router from "./platform/router";

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) =>
    router.fetch(request, env, ctx).then(json).catch(error),
};

export { Songs } from "./platform/do";
