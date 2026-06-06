import "server-only";
import { generateAnthropicText } from "@/lib/anthropic/client";
import type { AdObjective } from "@/types/database";

const OBJECTIVES: Record<AdObjective, string> = {
  visibility: "augmenter la notoriété locale",
  leads: "générer des demandes de contact",
  promo: "mettre en avant une promotion",
};

/** Texte par défaut si l'IA n'est pas configurée (fallback gracieux). */
function fallbackCopy(orgName: string, sector: string | null, objective: AdObjective): string {
  const sectorTxt = sector ? ` (${sector})` : "";
  switch (objective) {
    case "visibility":
      return `Découvrez ${orgName}${sectorTxt} — l'adresse de confiance près de chez vous.`;
    case "leads":
      return `Un projet ? Contactez ${orgName}${sectorTxt} pour un devis gratuit en 24h.`;
    case "promo":
      return `Offre exceptionnelle chez ${orgName}${sectorTxt} — profitez-en cette semaine !`;
  }
}

export async function generateAdCopy(
  objective: AdObjective,
  orgName: string,
  sector: string | null,
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return fallbackCopy(orgName, sector, objective);
  }
  try {
    const result = await generateAnthropicText({
      system:
        "Tu es un rédacteur publicitaire francophone. Tu écris des textes courts, percutants, pour des TPE de proximité. Maximum 2 phrases, ton chaleureux.",
      prompt: `Rédige un texte publicitaire pour ${orgName}${sector ? ` (secteur : ${sector})` : ""}. Objectif : ${OBJECTIVES[objective]}. Réponds UNIQUEMENT avec le texte, sans guillemets ni introduction.`,
      maxTokens: 200,
    });
    const text = result.text.trim();
    return text || fallbackCopy(orgName, sector, objective);
  } catch (e) {
    console.error("[generateAdCopy] anthropic échoué:", e);
    return fallbackCopy(orgName, sector, objective);
  }
}
