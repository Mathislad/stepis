import "server-only";

const BASE = "https://api.brevo.com/v3";

/**
 * Client HTTP minimaliste pour l'API Brevo (fetch natif, pas de SDK).
 * Serveur uniquement : la clé API ne doit jamais atteindre le navigateur.
 */
export async function brevoPost(path: string, body: object): Promise<unknown> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY manquante");

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo ${res.status} ${path} ${detail}`.trim());
  }
  return res.json().catch(() => ({}));
}
