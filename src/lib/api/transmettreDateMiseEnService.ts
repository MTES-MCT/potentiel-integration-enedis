import { ApiError } from "./error.js";

export type TransmettreDateDeMiseEnServiceProps = {
  identifiantProjet: string;
  référence: string;
  dateMiseEnService: Date;
};

type ApiClientProps = { apiUrl: string; authorizationHeader: string };

export async function transmettreDateDeMiseEnService({
  apiUrl,
  authorizationHeader,
  référence,
  dateMiseEnService,
  identifiantProjet,
}: TransmettreDateDeMiseEnServiceProps & ApiClientProps) {
  const url = `${apiUrl}/laureats/${encodeURIComponent(
    identifiantProjet,
  )}/raccordements/${encodeURIComponent(
    référence,
  )}/date-mise-en-service:transmettre`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authorizationHeader,
    },
    body: JSON.stringify({
      dateMiseEnService: dateMiseEnService.toISOString(),
    }),
  });
  if (!response.ok) {
    const body = (await response.json()) as Record<string, string>;
    if (
      body?.message ===
      "La date de mise en service est déjà transmise pour ce dossier de raccordement"
    ) {
      throw new ApiError("DATE_MISE_EN_SERVICE_DEJA_TRANSMISE");
    }

    throw new Error(
      `HTTP Error querying ${url}: ${response.status} ${
        response.statusText
      } (${JSON.stringify(body)})`,
    );
  }
}
