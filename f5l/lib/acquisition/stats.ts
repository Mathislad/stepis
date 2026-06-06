import { createClient } from "@/lib/supabase/server";

export interface AcquisitionStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  totalLeads: number;
}

export async function getAcquisitionStats(): Promise<AcquisitionStats> {
  const supabase = await createClient();
  const [campaignsRes, reportsRes] = await Promise.all([
    supabase.from("ad_campaigns").select("status, budget"),
    supabase.from("ad_campaign_reports").select("leads_count"),
  ]);
  let totalBudget = 0;
  let active = 0;
  for (const c of campaignsRes.data ?? []) {
    totalBudget += Number(c.budget) || 0;
    if (c.status === "active") active++;
  }
  let totalLeads = 0;
  for (const r of reportsRes.data ?? []) totalLeads += r.leads_count;
  return {
    totalCampaigns: campaignsRes.data?.length ?? 0,
    activeCampaigns: active,
    totalBudget,
    totalLeads,
  };
}
