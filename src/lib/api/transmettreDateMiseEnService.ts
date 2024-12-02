export type TransmettreDateDeMiseEnServiceProps = {
  identifiantProjet: string;
  reference: string;
  dateMiseEnService: Date;
};

type ApiClientProps = { apiUrl: string; authorizationHeader: string };

export async function transmettreDateDeMiseEnService({
  apiUrl,
  authorizationHeader,
  reference,
  dateMiseEnService,
  identifiantProjet,
}: TransmettreDateDeMiseEnServiceProps & ApiClientProps) {
  const url = `${apiUrl}/laureats/${encodeURIComponent(
    identifiantProjet,
  )}/raccordements/${encodeURIComponent(
    reference,
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
    throw new Error(
      `HTTP Error querying ${url}: ${response.status} ${
        response.statusText
      } (${await response.text()})`,
    );
  }
}
