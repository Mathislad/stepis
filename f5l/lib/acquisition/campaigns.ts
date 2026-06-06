import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/auth/context";
import type {
  AdCampaignReportRow,
  AdCampaignRow,
  AdObjective,
  AdPlatform,
  AdCampaignStatus,
} from "@/types/database";

export interface AdCampaignInput {
  title: string;
  objective: AdObjective;
  platform?: AdPlatform;
  budget?: number;
  duration_days?: number;
  status?: AdCampaignStatus;
  ad_copy?: string | null;
  ad_visual_url?: string | null;
}

export async function listAdCampaigns(): Promise<AdCampaignRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listAdCampaigns: ${error.message}`);
  return data ?? [];
}

export async function getAdCampaign(id: string): Promise<AdCampaignRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getAdCampaign: ${error.message}`);
  return data ?? null;
}

export async function getAdCampaignWithReports(id: string): Promise<{
  campaign: AdCampaignRow;
  reports: AdCampaignReportRow[];
} | null> {
  const supabase = await createClient();
  const { data: campaign, error } = await supabase
    .from("ad_campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getAdCampaignWithReports: ${error.message}`);
  if (!campaign) return null;
  const { data: reports } = await supabase
    .from("ad_campaign_reports")
    .select("*")
    .eq("campaign_id", id)
    .order("report_date", { ascending: false });
  return { campaign, reports: reports ?? [] };
}

export async function createAdCampaign(input: AdCampaignInput): Promise<AdCampaignRow> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("createAdCampaign: organisation introuvable.");
  const { data, error } = await supabase
    .from("ad_campaigns")
    .insert({ ...input, org_id: orgId })
    .select("*")
    .single();
  if (error) throw new Error(`createAdCampaign: ${error.message}`);
  return data;
}

export async function updateAdCampaign(
  id: string,
  input: Partial<AdCampaignInput>,
): Promise<AdCampaignRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`updateAdCampaign: ${error.message}`);
  return data;
}

export async function deleteAdCampaign(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("ad_campaigns").delete().eq("id", id);
  if (error) throw new Error(`deleteAdCampaign: ${error.message}`);
}
