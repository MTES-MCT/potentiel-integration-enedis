import { getLogger } from "../logger.js";
import { getAccessToken } from "./auth.js";
import { getAllDossiers } from "./getAllDossiers.js";
import {
  type ModifierReferenceDossierProps,
  modifierRéférenceDossier,
} from "./modifierReferenceDossier.js";
import {
  type TransmettreDateDeMiseEnServiceProps,
  transmettreDateDeMiseEnService,
} from "./transmettreDateMiseEnService.js";
import {
  type TransmettreDemandeCompleteDeRaccordementProps,
  transmettreDemandeCompleteDeRaccordement,
} from "./transmettreDemandeCompleteDeRaccordement.js";

type GetApiClientProps = {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
};

export async function getApiClient({
  apiUrl,
  clientId,
  clientSecret,
  issuerUrl,
}: GetApiClientProps) {
  const accessToken = await getAccessToken({
    clientId,
    clientSecret,
    issuerUrl,
  });
  getLogger().info("🔒 Authentification réussie");

  const authorizationHeader = `Bearer ${accessToken}`;
  return {
    raccordement: {
      getAllDossiers: (props: {
        inclureDossierManquant: boolean;
        inclureDossierEnService: boolean;
      }) => getAllDossiers({ authorizationHeader, apiUrl, ...props }),
      transmettreDateDeMiseEnService: (
        props: TransmettreDateDeMiseEnServiceProps,
      ) =>
        transmettreDateDeMiseEnService({
          ...props,
          apiUrl,
          authorizationHeader,
        }),
      modifierReferenceDossier: (props: ModifierReferenceDossierProps) =>
        modifierRéférenceDossier({ ...props, apiUrl, authorizationHeader }),
      transmettreDemandeCompleteDeRaccordement: (
        props: TransmettreDemandeCompleteDeRaccordementProps,
      ) =>
        transmettreDemandeCompleteDeRaccordement({
          ...props,
          apiUrl,
          authorizationHeader,
        }),
    },
  };
}

export type ApiClient = Awaited<ReturnType<typeof getApiClient>>;
