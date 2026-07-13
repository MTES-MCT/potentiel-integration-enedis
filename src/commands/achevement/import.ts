import { readFile } from "node:fs/promises";
import { Command, Flags } from "@oclif/core";
import { z } from "zod";
import { type ApiClient, getApiClient } from "../../lib/api/client.js";
import { ApiError } from "../../lib/api/error.js";
import { parseConfig } from "../../lib/config.js";
import { getCsvAsData } from "../../lib/csv.js";

export abstract class ImportAchèvement extends Command {
  private apiClient!: ApiClient;

  static description = "Importe des dates d'achèvement depuis un fichier CSV";

  static flags = {
    filename: Flags.file({ required: true }),
  };

  async init() {
    const config = parseConfig();

    this.apiClient = await getApiClient({
      apiUrl: config.API_URL,
      clientId: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET,
      issuerUrl: config.ISSUER_URL,
    });
  }

  async run() {
    const { flags } = await this.parse(ImportAchèvement);

    const schema = z.array(
      z.object({
        DATE_ACH: z.string().transform((str) => {
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
            const [day, month, year] = str.split("/");
            return new Date(+year, +month - 1, +day);
          } else if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
            return new Date(str);
          } else if (str) {
            throw new Error(`Invalid date format: ${str}`);
          }
        }),
        NUM_LAUREAT: z.string(),
      }),
    );
    const contents = await readFile(flags.filename, "utf-8");
    const raw = getCsvAsData(contents, { delimiter: "," });
    const data = schema.parse(raw);

    const erreurs = {} as Record<string, string[]>;
    const stats = {
      manquantes: 0,
      transmises: 0,
      erreurs: 0,
      déjàAchevé: 0,
    };
    for (const {
      NUM_LAUREAT: identifiantProjet,
      DATE_ACH: dateAchevement,
    } of data) {
      if (!dateAchevement) {
        console.log(`missing data for ${identifiantProjet}, skipping...`);
        stats.manquantes++;
        continue;
      }
      try {
        await this.apiClient.achèvement.transmettreDate({
          dateAchèvement: dateAchevement,
          identifiantProjet,
        });
        stats.transmises++;
      } catch (error) {
        if (!(error instanceof ApiError)) {
          throw error;
        }
        if (error.match(400, /Le projet est déjà achevé/)) {
          stats.déjàAchevé++;
          continue;
        }
        stats.erreurs++;
        erreurs[error.message] ??= [];
        erreurs[error.message].push(identifiantProjet);
      }
    }

    console.log("Fini !");
    console.table(stats);
    console.log(erreurs);
  }
}
