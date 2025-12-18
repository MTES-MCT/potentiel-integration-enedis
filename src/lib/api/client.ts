import createClient from "openapi-fetch";

import type { components, paths } from "../../potentiel-api.js";

import { createAuthMiddleware } from "./auth.js";
import { errorMiddleware } from "./error.middleware.js";
import { fetchAllItems } from "./fetchAllItems.js";

type GetApiClientProps = {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
};

export type ModifierReferenceDossierProps = {
  identifiantProjet: string;
  référence: string;
  nouvelleReference: string;
};

export type TransmettreDateDeMiseEnServiceProps = {
  identifiantProjet: string;
  référence: string;
  dateMiseEnService: Date;
};

export type TransmettreDemandeCompleteDeRaccordementProps = {
  identifiantProjet: string;
  référence: string;
  dateAccuseReception: Date;
};

export async function getApiClient({
  apiUrl,
  clientId,
  clientSecret,
  issuerUrl,
}: GetApiClientProps) {
  const authMiddleware = await createAuthMiddleware({
    clientId,
    clientSecret,
    issuerUrl,
  });

  const client = createClient<paths>({
    baseUrl: apiUrl,
  });

  client.use(authMiddleware);
  client.use(errorMiddleware);

  return {
    raccordement: {
      getDossiers: (avecDateMiseEnService: boolean) =>
        fetchAllItems<components["schemas"]["DossierRaccordement"]>({
          fetchPage: (after?: number) =>
            client.GET("/reseaux/raccordements", {
              params: {
                query: {
                  after,
                  avecDateMiseEnService,
                },
              },
            }),
          getId: (item) => `${item.identifiantProjet}-${item.referenceDossier}`,
        }),
      getDossiersManquants: () =>
        fetchAllItems<components["schemas"]["DossierRaccordement"]>({
          fetchPage: (after?: number) =>
            client.GET("/reseaux/raccordements/manquants", {
              params: { query: { after } },
            }),
          getId: (item) => item.identifiantProjet,
        }),
      transmettreDateDeMiseEnService: (
        props: TransmettreDateDeMiseEnServiceProps,
      ) =>
        client.POST(
          "/laureats/{identifiantProjet}/raccordements/{reference}/date-mise-en-service:transmettre",
          {
            body: {
              dateMiseEnService: props.dateMiseEnService
                .toISOString()
                .slice(0, 10),
            },
            params: {
              path: {
                identifiantProjet: props.identifiantProjet,
                reference: props.référence,
              },
            },
          },
        ),
      modifierReferenceDossier: (props: ModifierReferenceDossierProps) =>
        client.POST(
          "/laureats/{identifiantProjet}/raccordements/{reference}/reference:modifier",
          {
            body: { nouvelleReference: props.nouvelleReference },
            params: {
              path: {
                identifiantProjet: props.identifiantProjet,
                reference: props.référence,
              },
            },
          },
        ),
      transmettreDemandeCompleteDeRaccordement: (
        props: TransmettreDemandeCompleteDeRaccordementProps,
      ) =>
        client.POST(
          "/laureats/{identifiantProjet}/raccordements/demande-complete-raccordement:transmettre",
          {
            body: {
              dateAccuseReception: props.dateAccuseReception
                .toISOString()
                .slice(0, 10),
              reference: props.référence,
            },
            params: { path: { identifiantProjet: props.identifiantProjet } },
          },
        ),
    },
  };
}

export type ApiClient = Awaited<ReturnType<typeof getApiClient>>;
