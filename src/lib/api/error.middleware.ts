import type { Middleware } from "openapi-fetch";
import { getLogger } from "../logger.js";

export const errorMiddleware: Middleware = {
  onResponse({ response }) {
    if (!response.ok) {
      throw new Error(
        `${response.url}: ${response.status} ${response.statusText}`,
      );
    }
  },
  async onError({ error, schemaPath, params }) {
    getLogger().error("API request failed", { error, schemaPath, params });
    return new Error(`Oops, fetch failed : ${schemaPath}`, { cause: error });
  },
};
