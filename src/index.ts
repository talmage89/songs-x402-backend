import { error } from "itty-router";
import router from "./router";

export { SongsDo } from "./do/songs/songs";

const corsHeaders = (origin: string | null, allowedOrigin?: string) => ({
  "Access-Control-Allow-Origin": allowedOrigin || origin || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
});

const addCorsToResponse = (
  response: Response,
  origin: string | null,
  allowedOrigin?: string,
): Response => {
  if (response.status === 101 && response.webSocket) {
    return response;
  }

  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(origin, allowedOrigin)).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin");
    const allowedOrigin = env.ALLOWED_ORIGIN;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin, allowedOrigin),
      });
    }

    try {
      const response = await router.fetch(request, env, ctx);
      return addCorsToResponse(response, origin, allowedOrigin);
    } catch {
      const errorResponse = error(500);
      return addCorsToResponse(errorResponse, origin, allowedOrigin);
    }
  },
} satisfies ExportedHandler<Env>;
