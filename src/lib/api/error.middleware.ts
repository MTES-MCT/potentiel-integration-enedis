import type { Middleware } from "openapi-fetch";
import { getLogger } from "../logger.js";
import { ApiError } from "./error.js";

export const errorMiddleware: Middleware = {
  async onResponse({ response }) {
    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = undefined;
      }
      throw new ApiError(
        isErrorBody(errorBody) ? errorBody.error : response.statusText,
        response.status,
        response.url,
        errorBody,
      );
    }
  },
  async onError({ error, schemaPath, params }) {
    getLogger().error("API request failed", { error, schemaPath, params });
    return new Error(`Oops, fetch failed : ${schemaPath}`, { cause: error });
  },
};

const isErrorBody = (body: unknown): body is { error: string } => {
  return (
    !!body &&
    typeof body === "object" &&
    "error" in body &&
    typeof body.error === "string"
  );
};
