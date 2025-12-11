import { Command } from "@oclif/core";

import { type ApiClient, getApiClient } from "../lib/api/client.js";
import { parseConfig } from "../lib/config.js";
import { getLogger } from "../lib/logger.js";

export class Auth extends Command {
  private apiClient!: ApiClient;

  static description = "Test de l'authentification";

  static flags = {};

  async init() {
    const config = parseConfig();

    this.apiClient = await getApiClient({
      apiUrl: config.API_URL,
      clientId: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET,
      issuerUrl: config.ISSUER_URL,
    });
  }

  async run() {
    const logger = getLogger();

    while (true) {
      logger.info("Fetching dossiers to test authentication...");
      await this.apiClient.raccordement.getDossiers(false);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
