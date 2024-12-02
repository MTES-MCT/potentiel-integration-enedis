export type ModifierReferenceDossierProps = {
	identifiantProjet: string;
	reference: string;
	nouvelleReference: string;
};

type ApiClientProps = { apiUrl: string; authorizationHeader: string };

export async function modifierReferenceDossier({
	apiUrl,
	authorizationHeader,
	reference,
	nouvelleReference,
	identifiantProjet,
}: ModifierReferenceDossierProps & ApiClientProps) {
	const url = `${apiUrl}/laureats/${encodeURIComponent(
		identifiantProjet,
	)}/raccordements/${encodeURIComponent(reference)}/reference:modifier`;
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
