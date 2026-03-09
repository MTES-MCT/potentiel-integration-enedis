import { z } from "zod";

/**
 * DD/MM/YYYY ou YYYY-MM-DD ou vide
 **/
const optionalDateSchema = z
  .string()
  .optional()
  .transform((val) =>
    val
      ? new Date(val.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1")) // 31/12/2020 => 2020-12-31
      : undefined,
  );
/**
 * DD/MM/YYYY ou YYYY-MM-DD
 **/
const dateSchema = z.string().transform(
  (val) => new Date(val.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1")), // 31/12/2020 => 2020-12-31
);

const schemaDossierExistant = z.object({
  identifiantProjet: z.string().min(1),
  referenceDossier: z.string().min(1),
  dateMiseEnService: optionalDateSchema,
  nouvelleReference: z.string().optional(),
});
const schemaNouveauDossier = z.object({
  identifiantProjet: z.string().min(1),
  nouvelleReference: z.string().optional(),
  dateAccuseReception: dateSchema,
  dateMiseEnService: optionalDateSchema,
});

export const parseLine = (row: unknown) => {
  if (
    row &&
    typeof row === "object" &&
    "referenceDossier" in row &&
    row.referenceDossier
  ) {
    return {
      type: "dossier-existant" as const,
      ...schemaDossierExistant.safeParse(row),
    };
  }

  return {
    type: "nouveau-dossier" as const,
    ...schemaNouveauDossier.safeParse(row),
  };
};

export type LineData =
  | {
      type: "nouveau-dossier";
      data: z.infer<typeof schemaNouveauDossier>;
    }
  | {
      type: "dossier-existant";
      data: z.infer<typeof schemaDossierExistant>;
    };
