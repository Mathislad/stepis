import "server-only";

export interface SignatureResult {
  configured: boolean;
  message: string;
  signature_url?: string;
}

export async function createSignatureRequest(_documentId: string): Promise<SignatureResult> {
  if (!process.env.YOUSIGN_API_KEY) {
    return { configured: false, message: "Yousign non configuré." };
  }
  return { configured: false, message: "Intégration Yousign à finaliser." };
}
