import { config } from "dotenv";
import { z } from "zod";

export const parseConfig = (env = process.env) => {
  const envVar = (target: z.ZodTypeAny = z.string()) =>
    z
      .string()
      .transform((arg) => readEnvOrAlias(arg, env))
      .pipe(target);
  const configSchema = z.object({
    // Potentiel API
    API_URL: envVar(z.string().url()),
    // OAuth configuration
    ISSUER_URL: envVar(z.string().url()),
    CLIENT_ID: envVar(),
    CLIENT_SECRET: envVar(),
    // S3 configuration
    S3_ENDPOINT: envVar(z.string().url()),
    S3_BUCKET: envVar(),
    S3_REGION: envVar(),
    S3_ACCESS_KEY: envVar(),
    S3_SECRET_KEY: envVar(),
    UPLOAD_FILE_PATH_TEMPLATE: envVar(),
    DOWNLOAD_FOLDER: envVar(),

    // Emails
    MJ_APIKEY_PUBLIC: z.string().optional(),
    MJ_APIKEY_PRIVATE: z.string().optional(),
    MJ_TEMPLATE_ID: z.coerce.number().optional(),

    EMAIL_RECIPIENTS: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(",") : undefined))
      .pipe(z.string().trim().email().array().optional()),
  });
  config();
  return configSchema.parse(env);
};

/**
 * Enables using aliases in env var.
 * ie `MONGO_URL=$DATABASE_URL`
 * will return the value of `env.DATABASE_URL`
 */
const readEnvOrAlias = (val: string, env: NodeJS.Dict<string>) => {
  if (typeof val === "undefined") return;
  // https://stackoverflow.com/questions/68970312/how-do-i-resolve-a-javascript-template-literal-variable-within-a-string-within-a
  return val.replace(/\$\{(.*?)\}/g, (substring, key) =>
    env[key] ? env[key] : substring
  );
};
