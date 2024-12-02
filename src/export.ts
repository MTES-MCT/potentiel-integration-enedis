import { getApiClient } from "./lib/api/client.js";
import { parseConfig } from "./lib/config.js";
import { sendEmailNotificationsForAvailableFile } from "./lib/email.js";
import { exportToS3 } from "./lib/exportToS3.js";
import { getHealthcheckClient } from "./lib/healthcheck.js";
import { getLogger } from "./lib/logger.js";
import { getS3Client } from "./lib/s3.js";

async function main() {
  const logger = getLogger();
  logger.info(
    `🚩 Démarrage de l'export des données de raccordement pour Enedis`,
  );

  const config = parseConfig();
  const healthcheckClient = getHealthcheckClient(config.SENTRY_CRONS_EXPORT);
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

  await healthcheckClient.success();
  logger.info("🏁 Script terminé avec succès");
}
void main();
