import { extname } from "node:path";
import { z } from "zod";
import type { ApiClient } from "./api/client.js";
import { ApiError } from "./api/error.js";
import { getCsvAsData } from "./csv.js";
import { getLogger } from "./logger.js";
import type { S3Client } from "./s3.js";

const schema = z.object({
  identifiantProjet: z.string().min(1),
  referenceDossier: z.string().min(1),
  dateMiseEnService: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? new Date(val.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1")) // 31/12/2020 => 2020-12-31
        : undefined,
    ),
  nouvelleReference: z.string().optional(),
});

export type ImportFromS3Props = {
  apiClient: ApiClient;
  s3Client: S3Client;
  folderName: string;
};

export async function importFromS3({
  apiClient,
  s3Client,
  folderName,
}: ImportFromS3Props) {
  const logger = getLogger();
  const files = await s3Client.list(folderName);

  if (files.length === 0) {
    logger.info("⛔ Aucun ficher trouvé");
    return;
  }

  const errors: { identifiantProjet: string }[] = [];
  let nbDatesTransmises = 0;
  let nbDatesDejaTransmises = 0;
  let nbReferencesCorrigées = 0;
  for (const filename of files) {
    logger.info(`👷 Traitement du fichier ${filename}...`);
    if (extname(filename) !== ".csv") {
      logger.warn("⚠️ Extension inconnue, fichier ignoré");
      await s3Client.archive(filename);
      continue;
    }
    const contents = await s3Client.download(filename);
    const rows = getCsvAsData(contents);
    logger.info(`🛠  ${rows.length} lignes à traiter`);
    for (const row of rows) {
      const { data, success, error } = schema.safeParse(row);
      if (success) {
        if (!data.dateMiseEnService && !data.nouvelleReference) {
          logger.info("⏩ Pas d'informations à transmettre", {
            identifiantProjet: data.identifiantProjet,
            reference: data.referenceDossier,
          });
          continue;
        }
        if (data.dateMiseEnService) {
          logger.info("🗓  Transmission de la date de MES...", {
            identifiantProjet: data.identifiantProjet,
            reference: data.referenceDossier,
          });
          try {
            await apiClient.raccordement.transmettreDateDeMiseEnService({
              identifiantProjet: data.identifiantProjet,
              reference: data.referenceDossier,
              dateMiseEnService: data.dateMiseEnService,
            });
            nbDatesTransmises++;
          } catch (error) {
            errors.push(data);
            logger.warn("❗ Erreur lors de la transmission de la date de MES", {
              identifiantProjet: data.identifiantProjet,
              reference: data.referenceDossier,
              error: (error as Error).message,
            });
          }
        }
        if (
          data.nouvelleReference &&
          data.referenceDossier !== data.nouvelleReference
        ) {
          logger.info("🖊  Modification de la référence...", {
            identifiantProjet: data.identifiantProjet,
            reference: data.referenceDossier,
            nouvelleReference: data.nouvelleReference,
          });
          try {
            await apiClient.raccordement.modifierReferenceDossier({
              identifiantProjet: data.identifiantProjet,
              reference: data.referenceDossier,
              nouvelleReference: data.nouvelleReference,
            });
            nbReferencesCorrigées++;
          } catch (error) {
            if (error instanceof ApiError) {
              if (error.type === "DATE_MISE_EN_SERVICE_DEJA_TRANSMISE") {
                nbDatesDejaTransmises++;
                continue;
              }
            }
            // get HTTP body in case the error is an HTTP error
            errors.push(data);
            logger.warn("❗ Erreur lors de la modification de la référence", {
              identifiantProjet: data.identifiantProjet,
              reference: data.referenceDossier,
              error: (error as Error).message,
            });
          }
        }
      } else {
        logger.warn("❗ Ligne invalide", { row, error });
      }
    }
    await s3Client.archive(filename);
  }
  logger.info("✅ Import terminé:");
  logger.info(`    ${nbDatesTransmises} dates transmises`);
  logger.info(`    ${nbReferencesCorrigées} références corrigées`);
  logger.info(`    ${nbDatesDejaTransmises} dates déjà transmises`);
  logger.info(`    ${errors.length} erreurs`);
  if (errors.length > 0) {
    throw new Error(`${errors.length} erreurs ont eu lieu`);
  }
}
