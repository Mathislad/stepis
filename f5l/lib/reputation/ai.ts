import "server-only";
import { generateAnthropicText } from "@/lib/anthropic/client";
import type { ReviewRow } from "@/types/database";

type ReviewResponseDraftResult = {
  draft: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

function truncate(value: string | null, max: number): string {
  const text = (value ?? "").trim().replace(/\s+/g, " ");
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function sanitizeDraft(text: string): string {
  return text
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 1200);
}

export async function generateReviewResponseDraft(params: {
  orgName: string;
  review: ReviewRow;
}): Promise<ReviewResponseDraftResult> {
  const rating = params.review.rating ? `${params.review.rating}/5` : "note inconnue";
  const author = truncate(params.review.author_name, 80) || "Client";
  const content = truncate(params.review.content, 1400) || "Aucun commentaire public.";

  const result = await generateAnthropicText({
    maxTokens: 360,
    system:
      "Tu rédiges des brouillons de réponse à des avis publics pour des TPE françaises. " +
      "Tu respectes strictement la conformité Google : pas de compensation offerte en échange d'un avis, " +
      "pas de pression, pas de demande de modification ou suppression d'avis, pas de données personnelles. " +
      "Tu réponds à tous les avis avec empathie, sobriété et professionnalisme.",
    prompt:
      `Commerce: ${params.orgName}\n` +
      `Auteur: ${author}\n` +
      `Note: ${rating}\n` +
      `Avis: ${content}\n\n` +
      "Rédige une seule réponse publique en français, 70 à 120 mots maximum. " +
      "Si l'avis est négatif, reconnais le problème et invite à reprendre contact sans demander de changer l'avis. " +
      "Si l'avis est positif, remercie simplement et reste naturel. Retourne uniquement le texte de réponse.",
  });

  const draft = sanitizeDraft(result.text);
  if (!draft) throw new Error("Brouillon IA vide.");

  return {
    draft,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  };
}
