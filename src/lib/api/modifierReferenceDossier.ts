export type ModifierReferenceDossierProps = {
  identifiantProjet: string;
  référence: string;
  nouvelleReference: string;
};

type ApiClientProps = { apiUrl: string; authorizationHeader: string };

export async function modifierRéférenceDossier({
  apiUrl,
  authorizationHeader,
  référence,
  nouvelleReference,
  identifiantProjet,
}: ModifierReferenceDossierProps & ApiClientProps) {
  const url = `${apiUrl}/laureats/${encodeURIComponent(
    identifiantProjet,
  )}/raccordements/${encodeURIComponent(référence)}/reference:modifier`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authorizationHeader,
    },
    body: JSON.stringify({ nouvelleReference }),
  });
  if (!response.ok) {
    throw new Error(
      `HTTP Error querying ${url}: ${response.status} ${
        response.statusText
      } (${await response.text()})`,
    );
  }
}
