import { z } from "zod";

const optionalDateInFrench = z
  .string()
  .optional()
  .transform((val) =>
    val
      ? new Date(val.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1")) // 31/12/2020 => 2020-12-31
      : undefined,
  );
const dateInFrench = z.string().transform(
  (val) => new Date(val.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1")), // 31/12/2020 => 2020-12-31
);

const schemaDossierExistant = z.object({
  identifiantProjet: z.string().min(1),
  referenceDossier: z.string().min(1),
  dateMiseEnService: optionalDateInFrench,
  nouvelleReference: z.string().optional(),
});
const schemaNouveauDossier = z.object({
  identifiantProjet: z.string().min(1),
  nouvelleReference: z.string().optional(),
  dateAccuseReception: dateInFrench,
  dateMiseEnService: optionalDateInFrench,
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
