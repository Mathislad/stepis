import "server-only";
import type { PhoneSettingsRow } from "@/types/database";

/**
 * Stub Vapi (téléphonie IA). Tant qu'aucune clé n'est configurée, retourne
 * `configured: false` et journalise. Intégration réelle = étape ultérieure.
 */
export interface VapiResult {
  configured: boolean;
  message: string;
}

export async function configureVapiAgent(
  orgId: string,
  _settings: PhoneSettingsRow,
): Promise<VapiResult> {
  if (!process.env.VAPI_API_KEY) {
    return { configured: false, message: "Clé API Vapi non configurée." };
  }
  // DECISION: vrai appel Vapi à brancher quand la clé est disponible.
  console.log(`[vapi] configureVapiAgent appelé pour org ${orgId} (TODO)`);
  return { configured: false, message: "Intégration Vapi à finaliser." };
}

export async function getVapiStatus(): Promise<VapiResult> {
  if (!process.env.VAPI_API_KEY) {
    return { configured: false, message: "Clé API Vapi non configurée." };
  }
  return { configured: false, message: "Intégration Vapi à finaliser." };
}
