import "server-only";

export interface AdsResult {
  configured: boolean;
  message: string;
}

export async function createCampaign(_input: unknown): Promise<AdsResult> {
  if (!process.env.GOOGLE_ADS_TOKEN) return { configured: false, message: "Google Ads non configuré." };
  return { configured: false, message: "Intégration Google Ads à finaliser." };
}
export async function pauseCampaign(_id: string): Promise<AdsResult> {
  if (!process.env.GOOGLE_ADS_TOKEN) return { configured: false, message: "Google Ads non configuré." };
  return { configured: false, message: "Intégration Google Ads à finaliser." };
}
export async function getCampaignMetrics(_id: string): Promise<AdsResult> {
  if (!process.env.GOOGLE_ADS_TOKEN) return { configured: false, message: "Google Ads non configuré." };
  return { configured: false, message: "Intégration Google Ads à finaliser." };
}
