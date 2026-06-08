import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { brevoPost } from "@/lib/brevo/client";
import { buildCampaignDraftsWithClient } from "@/lib/loyalty-agent/engine";
import { limitFor, metricForChannel } from "@/lib/usage/limits";
import type { CampaignWithTemplate } from "@/lib/loyalty-agent/campaigns";
import type { Channel, Database, Formula } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export interface DispatchResult {
  sent: number;
  skipped: number;
  failed: number;
}

function senderEmail() {
  return {
    name: process.env.BREVO_SENDER_NAME || "F5L",
    email: process.env.BREVO_SENDER_EMAIL || "no-reply@stepis.fr",
  };
}

function smsSender() {
  return (process.env.BREVO_SMS_SENDER || "F5L").slice(0, 11);
}

function costUnits(channel: Channel): number {
  return channel === "email" ? 0.1 : 1;
}

function currentPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendViaBrevo(params: {
  channel: Channel;
  destination: string;
  subject: string | null;
  body: string;
  contactName: string;
}): Promise<void> {
  if (params.channel === "email") {
    await brevoPost("/smtp/email", {
      sender: senderEmail(),
      to: [{ email: params.destination, name: params.contactName }],
      subject: params.subject ?? "Une attention pour vous",
      htmlContent: `<p>${esc(params.body).replace(/\n/g, "<br/>")}</p>`,
    });
    return;
  }

  if (params.channel === "sms") {
    await brevoPost("/transactionalSMS/sms", {
      sender: smsSender(),
      recipient: params.destination,
      content: params.body,
    });
    return;
  }

  throw new Error("UNSUPPORTED_CHANNEL");
}

async function incrementUsage(params: {
  supabase: DbClient;
  orgId: string;
  channel: Channel;
  quantity: number;
}): Promise<void> {
  const metric = metricForChannel(params.channel);
  if (!metric) return;

  const period = currentPeriod();
  const { data: existing, error: readError } = await params.supabase
    .from("usage_metering")
    .select("id, quantity")
    .eq("org_id", params.orgId)
    .eq("period", period)
    .eq("metric", metric)
    .maybeSingle();
  if (readError) throw new Error(`incrementUsage(read): ${readError.message}`);

  if (existing) {
    const { error } = await params.supabase
      .from("usage_metering")
      .update({ quantity: existing.quantity + params.quantity })
      .eq("id", existing.id);
    if (error) throw new Error(`incrementUsage(update): ${error.message}`);
    return;
  }

  const { error } = await params.supabase
    .from("usage_metering")
    .insert({
      org_id: params.orgId,
      period,
      metric,
      quantity: params.quantity,
    });
  if (error) throw new Error(`incrementUsage(insert): ${error.message}`);
}

async function getCurrentUsage(params: {
  supabase: DbClient;
  orgId: string;
  channel: Channel;
}): Promise<number> {
  const metric = metricForChannel(params.channel);
  if (!metric) return 0;

  const { data, error } = await params.supabase
    .from("usage_metering")
    .select("quantity")
    .eq("org_id", params.orgId)
    .eq("period", currentPeriod())
    .eq("metric", metric)
    .maybeSingle();
  if (error) throw new Error(`getCurrentUsage: ${error.message}`);
  return data?.quantity ?? 0;
}

export async function dispatchCampaignNow(params: {
  campaign: CampaignWithTemplate;
  orgId: string;
  orgName: string;
  formula: Formula;
  limit?: number;
  supabase?: DbClient;
}): Promise<DispatchResult> {
  const supabase = params.supabase ?? (await createClient());
  const metric = metricForChannel(params.campaign.channel);
  const monthlyLimit = metric ? limitFor(params.formula, metric) : null;
  let currentUsage = await getCurrentUsage({
    supabase,
    orgId: params.orgId,
    channel: params.campaign.channel,
  });
  const drafts = await buildCampaignDraftsWithClient(
    supabase,
    params.campaign,
    params.orgName,
    { orgId: params.supabase ? params.orgId : undefined, limit: params.limit ?? 50 },
  );
  const result: DispatchResult = { sent: 0, skipped: 0, failed: 0 };

  for (const draft of drafts) {
    if (monthlyLimit !== null && currentUsage >= monthlyLimit) {
      await supabase
        .from("messages")
        .insert({
          org_id: params.orgId,
          contact_id: draft.contactId,
          campaign_id: params.campaign.id,
          dedupe_key: draft.dedupeKey,
          channel: params.campaign.channel,
          status: "skipped_limit_reached",
          cost_units: 0,
        });
      result.skipped += 1;
      continue;
    }

    const { data: pending, error: insertError } = await supabase
      .from("messages")
      .insert({
        org_id: params.orgId,
        contact_id: draft.contactId,
        campaign_id: params.campaign.id,
        dedupe_key: draft.dedupeKey,
        channel: params.campaign.channel,
        status: "pending",
        cost_units: costUnits(params.campaign.channel),
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") result.skipped += 1;
      else result.failed += 1;
      continue;
    }

    try {
      await sendViaBrevo({
        channel: params.campaign.channel,
        destination: draft.destination,
        subject: draft.subject,
        body: draft.body,
        contactName: draft.contactName,
      });
      await supabase.from("messages").update({ status: "sent" }).eq("id", pending.id);
      await incrementUsage({
        supabase,
        orgId: params.orgId,
        channel: params.campaign.channel,
        quantity: 1,
      });
      currentUsage += 1;
      result.sent += 1;
    } catch (error) {
      const status =
        error instanceof Error && error.message === "UNSUPPORTED_CHANNEL"
          ? "skipped_unsupported_channel"
          : "failed";
      await supabase.from("messages").update({ status }).eq("id", pending.id);
      if (status === "skipped_unsupported_channel") result.skipped += 1;
      else result.failed += 1;
    }
  }

  return result;
}
