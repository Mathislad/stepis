import "server-only";

export interface AdsResult {
  configured: boolean;
  message: string;
}

export async function createCampaign(input: unknown): Promise<AdsResult> {
  void input;
  if (!process.env.GOOGLE_ADS_TOKEN) return { configured: false, message: "Google Ads non configuré." };
  return { configured: false, message: "Intégration Google Ads à finaliser." };
}
export async function pauseCampaign(id: string): Promise<AdsResult> {
  void id;
  if (!process.env.GOOGLE_ADS_TOKEN) return { configured: false, message: "Google Ads non configuré." };
  return { configured: false, message: "Intégration Google Ads à finaliser." };
}
export async function getCampaignMetrics(id: string): Promise<AdsResult> {
  void id;
  if (!process.env.GOOGLE_ADS_TOKEN) return { configured: false, message: "Google Ads non configuré." };
  return { configured: false, message: "Intégration Google Ads à finaliser." };
}
