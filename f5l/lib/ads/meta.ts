import "server-only";

export interface AdsResult {
  configured: boolean;
  message: string;
}

export async function createCampaign(_input: unknown): Promise<AdsResult> {
  if (!process.env.META_ADS_TOKEN) return { configured: false, message: "Meta Ads non configuré." };
  return { configured: false, message: "Intégration Meta Ads à finaliser." };
}
export async function pauseCampaign(_id: string): Promise<AdsResult> {
  if (!process.env.META_ADS_TOKEN) return { configured: false, message: "Meta Ads non configuré." };
  return { configured: false, message: "Intégration Meta Ads à finaliser." };
}
export async function getCampaignMetrics(_id: string): Promise<AdsResult> {
  if (!process.env.META_ADS_TOKEN) return { configured: false, message: "Meta Ads non configuré." };
  return { configured: false, message: "Intégration Meta Ads à finaliser." };
}
