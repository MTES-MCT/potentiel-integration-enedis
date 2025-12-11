import type { Middleware } from "openapi-fetch";
import * as client from "openid-client";
import { getLogger } from "../logger.js";

type GetAccessTokenProps = {
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
};

let token: {
  access_token: string;
  expires_at: number;
} | null = null;

export const createAuthMiddleware = async ({
  clientId,
  clientSecret,
  issuerUrl,
}: GetAccessTokenProps): Promise<Middleware> => {
  const logger = getLogger();
  const options = issuerUrl.match(/http:\/\/localhost/)
    ? { execute: [client.allowInsecureRequests] }
    : {};
  const config = await client.discovery(
    new URL(issuerUrl),
    clientId,
    clientSecret,
    undefined,
    options,
  );

  return {
    async onRequest({ request }) {
      if (!token || token.expires_at <= Date.now()) {
        logger.debug("Récupération d'un nouveau jeton d'accès...");
        const { access_token, expires_in } =
          await client.clientCredentialsGrant(config);
        token = {
          access_token,
          expires_at: Date.now() + (expires_in ?? 0) * 1000,
        };
        logger.info("🔑 Jeton récupéré.");
      }

      request.headers.set("Authorization", `Bearer ${token.access_token}`);
      return request;
    },
  };
};
