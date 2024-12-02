import { getApiClient } from "./api/client.js";
import { parseConfig } from "./config.js";
import { getS3Client } from "./s3.js";
import { getLogger } from "./logger.js";
import { exportToS3 } from "./exportToS3.js";
import { importFromS3 } from "./importFromS3.js";
import { sendEmailNotificationsForAvailableFile } from "./email.js";
import { getHealthcheckClient } from "./healthcheck.js";

async function main() {
  const logger = getLogger();
  logger.info(`🚩 Démarrage de la synchronisation avec Enedis`);

  const config = parseConfig();
  const healthcheckClient = getHealthcheckClient(config.SENTRY_CRONS);
  await healthcheckClient.start();

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
  logger.info(`🔒 Authentification réussie`);

  try {
    const date = new Date().toISOString().slice(0, 10);
    const fileName = config.UPLOAD_FILE_PATH_TEMPLATE.replace("${date}", date);
    const success = await exportToS3({ apiClient, s3Client, fileName });
    if (success && config.MJ_TEMPLATE_ID) {
      await sendEmailNotificationsForAvailableFile({
        username: config.MJ_APIKEY_PUBLIC ?? "",
        password: config.MJ_APIKEY_PRIVATE ?? "",
        templateId: config.MJ_TEMPLATE_ID,
        recipients: config.EMAIL_RECIPIENTS ?? [],
      });
    }
  } catch (e) {
    logger.error(`💀 Erreur lors du traitement de l'export:`, e);
    await healthcheckClient.error();
    process.exit(1);
  }

  try {
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
  logger.info(`🏁 Script terminé avec succès`);
  await healthcheckClient.success();
}
void main();
