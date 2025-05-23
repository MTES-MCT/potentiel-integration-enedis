import { Command, Flags } from "@oclif/core";
import { type ApiClient, getApiClient } from "../lib/api/client.js";
import { parseConfig } from "../lib/config.js";
import { getDataAsCsv } from "../lib/csv.js";
import { getLocalFileWriter } from "../lib/files/local.js";
import { getS3Client } from "../lib/files/s3.js";
import type { FileWriter } from "../lib/files/type.js";
import {
  type HealtcheckClient,
  getHealthcheckClient,
} from "../lib/healthcheck.js";
import { getLogger } from "../lib/logger.js";

export class Export extends Command {
  private apiClient!: ApiClient;
  private fileWriter!: FileWriter;
  private uploadFilePathTemplate!: string;
  private healthcheckClient!: HealtcheckClient;

  static description =
    "Génère un fichier CSV sur S3 (ou local si le flag --local est utilisé) contenant les dossiers de raccordements sans date de mise en service";

  static flags = {
    local: Flags.boolean({
      description:
        "le fichier est généré en local au lieu du S3, utile pour tester",
    }),
    includeDossiersManquants: Flags.boolean({
      description:
        "Les raccordements sans dossiers sont ajoutés au fichier CSV",
    }),
  };

  async init() {
    const { flags } = await this.parse(Export);

    const config = parseConfig();

    this.healthcheckClient = getHealthcheckClient(
      config.SENTRY_CRONS_EXPORT,
      config.APPLICATION_STAGE,
    );

    this.apiClient = await getApiClient({
      apiUrl: config.API_URL,
      clientId: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET,
      issuerUrl: config.ISSUER_URL,
    });

    this.fileWriter = flags.local
      ? getLocalFileWriter("output")
      : await getS3Client({
          accessKey: config.S3_ACCESS_KEY,
          secretKey: config.S3_SECRET_KEY,
          endpoint: config.S3_ENDPOINT,
          region: config.S3_REGION,
          bucketName: config.S3_BUCKET,
          prefix: config.DOWNLOAD_FOLDER,
        });

    this.uploadFilePathTemplate = config.UPLOAD_FILE_PATH_TEMPLATE;

    await this.healthcheckClient.start();
  }

  protected async finally(err: Error | undefined) {
    if (err) {
      await this.healthcheckClient.error();
    } else {
      await this.healthcheckClient.success();
    }
  }

  async run() {
    const { flags } = await this.parse(Export);

    const logger = getLogger();
    logger.info(
      "⬆️  Création du fichier des dossiers en attente de mise en service...",
    );
    const dossiers = await this.apiClient.raccordement.getAllDossiers({
      includeManquants: flags.includeDossiersManquants,
    });

    if (dossiers.length === 0) {
      logger.info("⛔ Aucun dossier de raccordement à traiter");
      return;
    }
    logger.info(`📁 ${dossiers.length} dossiers en attente`);
    const csvData = await getDataAsCsv({
      data: dossiers.map((dossier) => ({
        ...dossier,

        // Champs à remplir
        dateMiseEnService: "",
        nouvelleReference: "",
        dateAccuseReception: "",
      })),
    });

    const date = new Date().toISOString().slice(0, 10);
    const filename = this.uploadFilePathTemplate.replace("${date}", date);
    await this.fileWriter.upload(filename, csvData);
    logger.info(`🛎️ Fichier créé: ${filename}`);
  }
}
