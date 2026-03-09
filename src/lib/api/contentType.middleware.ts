import type { Middleware } from "openapi-fetch";

export const contentTypeMiddleware: Middleware = {
  onRequest: ({ request }) => {
    if (request.method === "PATCH") {
      request.headers.set("Content-Type", "application/merge-patch+json");
    }
    return request;
  },
};
