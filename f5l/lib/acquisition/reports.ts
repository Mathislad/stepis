import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/auth/context";
import type { AdCampaignReportRow } from "@/types/database";

export interface ReportInput {
  campaign_id: string;
  report_date: string;
  impressions: number;
  clicks: number;
  leads_count: number;
  spend: number;
}

export async function listReports(campaignId: string): Promise<AdCampaignReportRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_campaign_reports")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("report_date", { ascending: false });
  if (error) throw new Error(`listReports: ${error.message}`);
  return data ?? [];
}

/** Pour les futurs webhooks Meta/Google. `org_id` résolu serveur. */
export async function addReport(input: ReportInput): Promise<AdCampaignReportRow> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("addReport: organisation introuvable.");
  const { data, error } = await supabase
    .from("ad_campaign_reports")
    .upsert(
      { ...input, org_id: orgId },
      { onConflict: "campaign_id,report_date" },
    )
    .select("*")
    .single();
  if (error) throw new Error(`addReport: ${error.message}`);
  return data;
}
