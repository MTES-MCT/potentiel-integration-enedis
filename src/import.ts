import { getApiClient } from "./lib/api/client.js";
import { parseConfig } from "./lib/config.js";
import { getS3Client } from "./lib/s3.js";
import { getLogger } from "./lib/logger.js";
import { importFromS3 } from "./lib/importFromS3.js";
import { getHealthcheckClient } from "./lib/healthcheck.js";

async function main() {
  const logger = getLogger();
  logger.info(
    `🚩 Démarrage de l'import des données de raccordement depuis Enedis`
  );
  const config = parseConfig();
  const healthcheckClient = getHealthcheckClient(config.SENTRY_CRONS_IMPORT);
  await healthcheckClient.start();
  try {
    const s3Client = await getS3Client({
      accessKey: config.S3_ACCESS_KEY,
      secretKey: config.S3_SECRET_KEY,
      endpoint: config.S3_ENDPOINT,
      region: config.S3_REGION,
      bucketName: config.S3_BUCKET,
    });

    const apiClient = await getApiClient({
      apiUrl: config.API_URL,
      clientId: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET,
      issuerUrl: config.ISSUER_URL,
    });

    logger.info(
      `⬇️  Récupération du fichier d'import des dates de mise en service...`
    );
    await importFromS3({
      apiClient,
      s3Client,
      folderName: config.DOWNLOAD_FOLDER,
    });
  } catch (e) {
    logger.error(`💀 Erreur lors du traitement de l'import:`, e);
    await healthcheckClient.error();
    process.exit(1);
  }
  await healthcheckClient.success();
  logger.info(`🏁 Script terminé avec succès`);
}
void main();
