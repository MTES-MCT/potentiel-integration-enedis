import type { ApiClient } from "../api/client.js";
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

    await apiClient.raccordement.modifierReferenceDossier(payload);
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
    await apiClient.raccordement.transmettreDemandeCompleteDeRaccordement(
      payload,
    );
    logger.info("➕ Dossier transmis", { identifiantProjet });

    stats.nbDCRTransmises++;
    // Appliquer un délai pour assurer que la modification de la référence est bien prise en compte
    await new Promise((r) => setTimeout(r, 1000));
  }

  const référence =
    type === "dossier-existant"
      ? data.referenceDossier
      : data.nouvelleReference;

  if (data.dateMiseEnService && référence) {
    const payload = {
      identifiantProjet,
      référence,
      dateMiseEnService: data.dateMiseEnService,
    };
    logger.info("🗓  Transmission de la date de MES...", payload);

    await apiClient.raccordement.transmettreDateDeMiseEnService(payload);
    logger.info("🗓  Date transmise...", { identifiantProjet });

    stats.nbDatesTransmises++;
  }
  return stats;
}
