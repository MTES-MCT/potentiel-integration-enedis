import { config } from "dotenv";
import { z } from "zod";
import type { SendEmailNotificationsForAvailableFileProps } from "./email.js";

export const parseConfig = (env = process.env) => {
  const configSchema = z.object({
    APPLICATION_STAGE: z.string().default("local"),
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

    // Healthcheck
    SENTRY_CRONS_IMPORT: z.string().url().optional(),
    SENTRY_CRONS_EXPORT: z.string().url().optional(),
  });
  config();
  return configSchema.parse(env);
};

export const parseEmailConfig = (
  env = process.env,
): SendEmailNotificationsForAvailableFileProps | undefined => {
  const emailConfigSchema = z.object({
    MJ_APIKEY_PUBLIC: z.string().nonempty(),
    MJ_APIKEY_PRIVATE: z.string().nonempty(),
    MJ_TEMPLATE_ID: z.coerce.number(),
    EMAIL_RECIPIENTS: z
      .string()
      .transform((val) => (val ? val.split(",") : undefined))
      .pipe(z.string().trim().email().array().optional()),
  });
  const result = emailConfigSchema.safeParse(env);
  if (!result.success) {
    return undefined;
  }
  return {
    password: result.data.MJ_APIKEY_PRIVATE,
    username: result.data.MJ_APIKEY_PUBLIC,
    templateId: result.data.MJ_TEMPLATE_ID,
    recipients: result.data.EMAIL_RECIPIENTS ?? [],
  };
};
