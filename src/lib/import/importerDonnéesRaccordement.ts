import type { ApiClient } from "../api/client.js";
import { ApiError } from "../api/error.js";
import { getLogger } from "../logger.js";
import { createStats } from "../stats.js";
import type { LineData } from "./parseLine.js";

export async function importerDonnéesDossierRaccordement(
  { type, data }: LineData,
  apiClient: ApiClient,
) {
  const logger = getLogger();
  const stats = createStats();

  const { identifiantProjet } = data;
  if (
    type === "dossier-existant" &&
    data.nouvelleReference &&
    data.referenceDossier !== data.nouvelleReference
  ) {
    const payload = {
      identifiantProjet,
      référence: data.referenceDossier,
      nouvelleReference: data.nouvelleReference,
    };
    logger.info("🖊  Modification de la référence...", payload);

    await apiClient.raccordement.demandeComplèteDeRaccordement.modifier(
      payload,
    );
    logger.info("🖊  Référence modifiée", { identifiantProjet });
    stats.référencesModifiées++;

    // Appliquer un délai pour assurer que la modification de la référence est bien prise en compte
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (type === "nouveau-dossier" && data.nouvelleReference) {
    const payload = {
      identifiantProjet,
      référence: data.nouvelleReference,
      dateAccuseReception: data.dateAccuseReception,
    };
    logger.info("➕ Transmission d'un nouveau dossier", payload);
    await apiClient.raccordement.demandeComplèteDeRaccordement.transmettre(
      payload,
    );
    logger.info("➕ Dossier transmis", { identifiantProjet });

    stats.nbDCRTransmises++;
    // Appliquer un délai pour assurer que la modification de la référence est bien prise en compte
    await new Promise((r) => setTimeout(r, 1000));
  }

  const référence =
    type === "nouveau-dossier" || data.nouvelleReference
      ? data.nouvelleReference
      : data.referenceDossier;

  if (data.dateMiseEnService && référence) {
    const payload = {
      identifiantProjet,
      référence,
      dateMiseEnService: data.dateMiseEnService,
    };
    logger.info("🗓  Transmission de la date de MES...", payload);

    const result = await transmettreOuModifierDateMiseEnService(
      apiClient,
      payload,
    );
    switch (result) {
      case "transmise":
        stats.nbDatesTransmises++;
        break;
      case "modifiée":
        stats.nbDatesModifiees++;
        break;
      case "pas de changement":
        stats.nbDatesIdentiques++;
        break;
      default: {
        // This should never happen - all cases are handled above
        const _exhaustiveCheck: never = result;
        throw new Error(`Résultat inattendu: ${_exhaustiveCheck}`);
      }
    }
  }
  return stats;
}

async function transmettreOuModifierDateMiseEnService(
  apiClient: ApiClient,
  payload: {
    identifiantProjet: string;
    référence: string;
    dateMiseEnService: Date;
  },
) {
  const logger = getLogger();
  const { identifiantProjet, référence, dateMiseEnService } = payload;

  try {
    await apiClient.raccordement.miseEnService.transmettre(payload);
    logger.info("🗓  Date transmise", { identifiantProjet });
    return "transmise";
  } catch (error) {
    if (!ApiError.match(error, 400, /a déjà été transmise/)) {
      throw error;
    }
  }

  logger.info("🗓  Date déjà transmise, tentative de modification...", {
    identifiantProjet,
  });

  try {
    await apiClient.raccordement.miseEnService.modifier({
      identifiantProjet,
      référence,
      dateMiseEnService,
    });
    logger.info("🗓  Date modifiée", { identifiantProjet });
    return "modifiée";
  } catch (error) {
    if (!ApiError.match(error, 400, /Aucune modification/)) {
      throw error;
    }
  }

  logger.info(
    "🗓  Date déjà transmise et identique, aucune modification nécessaire",
    { identifiantProjet },
  );
  return "pas de changement";
}
