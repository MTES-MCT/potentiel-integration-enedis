type GetAllDossiersProps = {
  apiUrl: string;
  authorizationHeader: string;
  inclureDossierManquant: boolean;
  inclureDossierEnService: boolean;
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
  puissance: string;
  nomCandidat: string;
  sociétéMère: string;
  emailContact: string;
  siteProduction: string;
  dateNotification: string;
};

type GetAllDossiersResponse = {
  items: DossierRaccordement[];
  range: { startPosition: number; endPosition: number };
  total: number;
};

async function fetchDossiers({
  url,
  authorizationHeader,
}: {
  url: URL;
  authorizationHeader: string;
}) {
  const dossiers: DossierRaccordement[] = [];
  let page = 1;
  while (true) {
    url.searchParams.set("page", String(page));
    const response = await fetch(url, {
      headers: { Authorization: authorizationHeader },
    });
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(
        `HTTP Error querying ${url}: ${response.status} ${response.statusText} (${errBody})`,
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

async function getDossiersManquants({
  apiUrl,
  authorizationHeader,
  inclureDossierManquant,
}: GetAllDossiersProps) {
  if (!inclureDossierManquant) {
    return [];
  }
  const url = new URL(`${apiUrl}/reseaux/raccordements/manquants`);
  return fetchDossiers({ url, authorizationHeader });
}

async function getDossiersRaccordements({
  apiUrl,
  authorizationHeader,
  inclureDossierEnService,
}: GetAllDossiersProps) {
  const url = new URL(`${apiUrl}/reseaux/raccordements`);

  if (!inclureDossierEnService) {
    url.searchParams.set("avecDateMiseEnService", "false");
  }

  return fetchDossiers({ url, authorizationHeader });
}

export async function getAllDossiers(props: GetAllDossiersProps) {
  const dossiersRaccordements = await getDossiersRaccordements(props);
  const dossiersManquants = await getDossiersManquants(props);

  return [...dossiersRaccordements, ...dossiersManquants];
}
