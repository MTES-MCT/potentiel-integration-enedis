type GetAllDossiersProps = {
  apiUrl: string;
  authorizationHeader: string;
};

type DossierRaccordement = {
  nomProjet: string;
  identifiantProjet: string;
  appelOffre: string;
  periode: string;
  famille: string;
  numeroCRE: string;
  commune: string;
  codePostal: string;
  referenceDossier: string;
  statutDGEC: string;
};

type GetAllDossiersResponse = {
  items: DossierRaccordement[];
  range: { startPosition: number; endPosition: number };
  total: number;
};

export async function getAllDossiers({
  apiUrl,
  authorizationHeader,
}: GetAllDossiersProps) {
  const url = new URL(`${apiUrl}/reseaux/raccordements`);
  const dossiers: DossierRaccordement[] = [];
  let page = 1;
  while (page < 100) {
    url.searchParams.set("page", String(page));
    const response = await fetch(url, {
      headers: { Authorization: authorizationHeader },
    });
    if (!response.ok) {
      throw new Error(
        `HTTP Error querying ${url}: ${response.status} ${response.statusText} (${await response.text()})`
      );
    }
    const { items, total } = (await response.json()) as GetAllDossiersResponse;
    dossiers.push(...items);
    if (dossiers.length >= total) {
      break;
    }
    page++;
  }
  return dossiers;
}
