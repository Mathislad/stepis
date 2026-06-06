import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchCampaignNow, type DispatchResult } from "@/lib/loyalty-agent/dispatch";
import { parseCampaignTemplate, type CampaignWithTemplate } from "@/lib/loyalty-agent/campaigns";
import type { CampaignRow, Json } from "@/types/database";

export interface CronCampaignResult extends DispatchResult {
  campaignId: string;
  orgId: string;
}

export interface LoyaltyAgentCronResult {
  organizations: number;
  campaigns: number;
  sent: number;
  skipped: number;
  failed: number;
  results: CronCampaignResult[];
}

function hydrateCampaign(row: CampaignRow): CampaignWithTemplate {
  return {
    ...row,
    templateData: parseCampaignTemplate(row.template),
    audienceCount: 0,
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function isRecord(value: Json): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function writeManagerTrail(params: {
  admin: ReturnType<typeof createAdminClient>;
  orgId: string;
  results: CronCampaignResult[];
}): Promise<void> {
  const sent = params.results.reduce((sum, result) => sum + result.sent, 0);
  const skipped = params.results.reduce((sum, result) => sum + result.skipped, 0);
  const failed = params.results.reduce((sum, result) => sum + result.failed, 0);
  const payload: Json = {
    campaigns: params.results.length,
    sent,
    skipped,
    failed,
    ran_at: new Date().toISOString(),
  };

  await params.admin.from("audit_log").insert({
    org_id: params.orgId,
    agent: "loyalty_agent",
    action: "cron_run",
    payload,
  });

  const digestDate = today();
  const { data: existing } = await params.admin
    .from("daily_digest")
    .select("summary")
    .eq("org_id", params.orgId)
    .eq("digest_date", digestDate)
    .maybeSingle();
  const previous = existing && isRecord(existing.summary) ? existing.summary : {};

  await params.admin.from("daily_digest").upsert(
    {
      org_id: params.orgId,
      digest_date: digestDate,
      summary: {
        ...previous,
        loyalty_agent: payload,
      },
    },
    { onConflict: "org_id,digest_date" },
  );
}

export async function runLoyaltyAgentCron(): Promise<LoyaltyAgentCronResult> {
  const admin = createAdminClient();
  const { data: moduleRows, error: moduleError } = await admin
    .from("org_modules")
    .select("org_id")
    .eq("module_key", "loyalty_agent")
    .eq("enabled", true);
  if (moduleError) throw new Error(`runLoyaltyAgentCron(modules): ${moduleError.message}`);

  const orgIds = [...new Set((moduleRows ?? []).map((row) => row.org_id))];
  if (orgIds.length === 0) {
    return { organizations: 0, campaigns: 0, sent: 0, skipped: 0, failed: 0, results: [] };
  }

  const [{ data: orgs, error: orgError }, { data: campaigns, error: campaignError }] =
    await Promise.all([
      admin.from("organizations").select("id, name, formula").in("id", orgIds),
      admin
        .from("campaigns")
        .select("*")
        .in("org_id", orgIds)
        .eq("active", true)
        .order("updated_at", { ascending: true }),
    ]);
  if (orgError) throw new Error(`runLoyaltyAgentCron(orgs): ${orgError.message}`);
  if (campaignError) {
    throw new Error(`runLoyaltyAgentCron(campaigns): ${campaignError.message}`);
  }

  const orgById = new Map((orgs ?? []).map((org) => [org.id, org]));
  const results: CronCampaignResult[] = [];

  for (const row of campaigns ?? []) {
    const org = orgById.get(row.org_id);
    if (!org) continue;

    const dispatch = await dispatchCampaignNow({
      supabase: admin,
      campaign: hydrateCampaign(row),
      orgId: row.org_id,
      orgName: org.name,
      formula: org.formula,
      limit: 50,
    });
    results.push({ campaignId: row.id, orgId: row.org_id, ...dispatch });
  }

  const resultsByOrg = new Map<string, CronCampaignResult[]>();
  for (const result of results) {
    const current = resultsByOrg.get(result.orgId) ?? [];
    current.push(result);
    resultsByOrg.set(result.orgId, current);
  }
  for (const [orgId, orgResults] of resultsByOrg) {
    await writeManagerTrail({ admin, orgId, results: orgResults });
  }

  return {
    organizations: orgIds.length,
    campaigns: results.length,
    sent: results.reduce((sum, result) => sum + result.sent, 0),
    skipped: results.reduce((sum, result) => sum + result.skipped, 0),
    failed: results.reduce((sum, result) => sum + result.failed, 0),
    results,
  };
}
