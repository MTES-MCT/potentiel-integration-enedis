export type TransmettreDemandeCompleteDeRaccordementProps = {
  identifiantProjet: string;
  référence: string;
  dateAccuseReception: Date;
};

type ApiClientProps = { apiUrl: string; authorizationHeader: string };

export async function transmettreDemandeCompleteDeRaccordement({
  apiUrl,
  authorizationHeader,
  référence,
  dateAccuseReception,
  identifiantProjet,
}: TransmettreDemandeCompleteDeRaccordementProps & ApiClientProps) {
  const url = `${apiUrl}/laureats/${encodeURIComponent(
    identifiantProjet,
  )}/raccordements/demande-complete-raccordement:transmettre`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authorizationHeader,
    },
    body: JSON.stringify({
      reference: référence,
      dateAccuseReception: dateAccuseReception.toISOString(),
    }),
  });
  if (!response.ok) {
    const body = (await response.json()) as Record<string, string>;

    throw new Error(
      `HTTP Error querying ${url}: ${response.status} ${
        response.statusText
      } (${JSON.stringify(body)})`,
    );
  }
}
