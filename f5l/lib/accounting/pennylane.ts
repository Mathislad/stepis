import "server-only";

export interface AccountingResult {
  configured: boolean;
  message: string;
}

export async function syncDocument(documentId: string): Promise<AccountingResult> {
  void documentId;
  if (!process.env.PENNYLANE_API_KEY) {
    return { configured: false, message: "Pennylane non configuré." };
  }
  return { configured: false, message: "Intégration Pennylane à finaliser." };
}
