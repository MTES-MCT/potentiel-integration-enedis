import { Command, Flags } from "@oclif/core";
import { type ApiClient, getApiClient } from "../lib/api/client.js";
import { parseConfig } from "../lib/config.js";
import { getCsvAsData } from "../lib/csv.js";
import { getLocalFileReader } from "../lib/files/local.js";
import { getS3Client } from "../lib/files/s3.js";
import type { FileReader } from "../lib/files/type.js";
import {
  getHealthcheckClient,
  type HealtcheckClient,
} from "../lib/healthcheck.js";
import { importerDonnéesDossierRaccordement } from "../lib/import/importerDonnéesRaccordement.js";
import { parseLine } from "../lib/import/parseLine.js";
import { getLogger, type Logger } from "../lib/logger.js";
import { createStats, mergeStats } from "../lib/stats.js";

export abstract class Import extends Command {
  private apiClient!: ApiClient;
  private healthcheckClient!: HealtcheckClient;
  private logger!: Logger;
  private fileReader!: FileReader;

  static description =
    "Importe depuis un fichier CSV sur S3 (ou local si --filename est utilisé) pour transmission des dates de mise en service, modification des référence de raccordement et/ou transmission d'une DCR";

  static flags = {
    filename: Flags.file({}),
  };

  async init() {
    const { flags } = await this.parse(Import);

    const config = parseConfig();

    this.healthcheckClient = getHealthcheckClient(
      config.SENTRY_CRONS_IMPORT,
      config.APPLICATION_STAGE,
    );

    this.fileReader = flags.filename
      ? getLocalFileReader(flags.filename)
      : await getS3Client({
          accessKey: config.S3_ACCESS_KEY,
          secretKey: config.S3_SECRET_KEY,
          endpoint: config.S3_ENDPOINT,
          region: config.S3_REGION,
          bucketName: config.S3_BUCKET,
          prefix: config.DOWNLOAD_FOLDER,
        });

    this.logger = getLogger();
    this.apiClient = await getApiClient({
      apiUrl: config.API_URL,
      clientId: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET,
      issuerUrl: config.ISSUER_URL,
    });

    await this.healthcheckClient.start();
  }

  protected async finally(err: Error | undefined) {
    if (err) {
      await this.healthcheckClient?.error();
    } else {
      await this.healthcheckClient.success();
    }
  }

  async run() {
    this.logger.info(
      `🚩 Démarrage de l'import des données de raccordement depuis Enedis`,
    );

    const files = await this.fileReader.list();

    if (files.length === 0) {
      this.logger.info("⛔ Aucun ficher trouvé");
      return;
    }

    const errors: { identifiantProjet: string }[] = [];

    const stats = createStats();
    let nbLignesInvalides = 0;

    for (const filename of files) {
      this.logger.info(`👷 Traitement du fichier ${filename}...`);

      const contents = await this.fileReader.download(filename);
      const rows = getCsvAsData(contents);

      this.logger.info(`🛠  ${rows.length} lignes à traiter`);
      for (const row of rows) {
        const parsed = parseLine(row);
        if (!parsed.success) {
          this.logger.warn("❗ Ligne invalide", {
            row,
            error: parsed.error,
            type: parsed.type,
          });
          nbLignesInvalides++;
          continue;
        }

        try {
          const statsImport = await importerDonnéesDossierRaccordement(
            parsed,
            this.apiClient,
          );

          mergeStats({ stats: statsImport, into: stats });
        } catch (error) {
          const message = (error as Error).message;
          errors.push(parsed.data);
          this.logger.warn("❗ Erreur lors de l'import", {
            identifiantProjet: parsed.data.identifiantProjet,
            reference:
              parsed.type === "dossier-existant"
                ? parsed.data.referenceDossier
                : parsed.data.nouvelleReference,
            error: message,
          });
        }
      }

      await this.fileReader.archive(filename);
    }
    this.logger.info("✅ Import terminé:");

    this.logger.info("📈 Stats: ", stats);
    this.logger.info(`❗ ${errors.length} erreurs`);
    if (errors.length > 0) {
      throw new Error(`${errors.length} erreurs ont eu lieu`);
    }
    if (nbLignesInvalides) {
      throw new Error("Des lignes du fichier sont invalides");
    }
  }
}
