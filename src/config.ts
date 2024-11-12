import { config } from "dotenv";
import { z } from "zod";

export const parseConfig = () => {
  const configSchema = z.object({
    // Potentiel API
    API_URL: z.string().url(),
    // OAuth configuration
    ISSUER_URL: z.string().url(),
    CLIENT_ID: z.string(),
    CLIENT_SECRET: z.string(),
    // S3 configuration
    S3_ENDPOINT: z.string().url(),
    S3_BUCKET: z.string(),
    S3_REGION: z.string(),
    S3_ACCESS_KEY: z.string(),
    S3_SECRET_KEY: z.string(),
    UPLOAD_FILE_PATH_TEMPLATE: z.string(),
    DOWNLOAD_FOLDER: z.string(),
  });
  config();
  return configSchema.parse(process.env);
};
