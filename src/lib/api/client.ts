import { getLogger } from "../logger.js";
import { getAccessToken } from "./auth.js";
import { getAllDossiers } from "./getAllDossiers.js";
import {
  type ModifierReferenceDossierProps,
  modifierReferenceDossier,
} from "./modifierReferenceDossier.js";
import {
  type TransmettreDateDeMiseEnServiceProps,
  transmettreDateDeMiseEnService,
} from "./transmettreDateMiseEnService.js";

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
      getAllDossiers: () => getAllDossiers({ authorizationHeader, apiUrl }),
      transmettreDateDeMiseEnService: (
        props: TransmettreDateDeMiseEnServiceProps,
      ) =>
        transmettreDateDeMiseEnService({
          ...props,
          apiUrl,
          authorizationHeader,
        }),
      modifierReferenceDossier: (props: ModifierReferenceDossierProps) =>
        modifierReferenceDossier({ ...props, apiUrl, authorizationHeader }),
    },
  };
}

export type ApiClient = Awaited<ReturnType<typeof getApiClient>>;
