import "server-only";

export interface AccountingResult {
  configured: boolean;
  message: string;
}

export async function syncDocument(_documentId: string): Promise<AccountingResult> {
  if (!process.env.PENNYLANE_API_KEY) {
    return { configured: false, message: "Pennylane non configuré." };
  }
  return { configured: false, message: "Intégration Pennylane à finaliser." };
}
