import router from "./router";

export { SongsDo } from "./do/songs/songs";

export default {
  fetch: (request, env, ctx) => router.fetch(request, env, ctx),
} satisfies ExportedHandler<Env>;
