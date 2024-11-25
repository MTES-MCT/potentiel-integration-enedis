import { ApiClient } from "./api/client.js";
import { getDataAsCsv } from "./csv.js";
import { getLogger } from "./logger.js";
import { S3Client } from "./s3.js";

export type ExportToS3Props = {
  apiClient: ApiClient;
  s3Client: S3Client;
  fileName: string;
};

export async function exportToS3({
  apiClient,
  s3Client,
  fileName,
}: ExportToS3Props) {
  const logger = getLogger();
  logger.info(
    "⬆️  Création du fichier des dossiers en attente de mise en service..."
  );
  const dossiers = await apiClient.raccordement.getAllDossiers();

  if (dossiers.length === 0) {
    logger.info("⛔ Aucun dossier de raccordement à traiter");
    return;
  }
  logger.info(`📁 ${dossiers.length} dossiers en attente`);
  const csvData = await getDataAsCsv({
    data: dossiers.map((dossier) => ({
      ...dossier,
      dateMiseEnService: "",
      nouvelleReference: "",
    })),
  });

  await s3Client.upload(fileName, csvData);

  logger.info(`🛎️ Fichier créé: ${fileName}`);
}
