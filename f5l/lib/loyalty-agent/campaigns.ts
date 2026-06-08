import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/auth/context";
import { limitFor } from "@/lib/usage/limits";
import type {
  CampaignRow,
  CampaignTrigger,
  Channel,
  Formula,
  Json,
  MessageRow,
  UsageMetric,
} from "@/types/database";

export interface CampaignTemplate {
  name: string;
  subject: string | null;
  body: string;
  offer: string | null;
  inactiveDays: number | null;
}

export interface CampaignWithTemplate extends CampaignRow {
  templateData: CampaignTemplate;
  audienceCount: number;
}

export interface CampaignInput {
  trigger: CampaignTrigger;
  channel: Channel;
  template: CampaignTemplate;
  active?: boolean;
}

export interface LoyaltyAgentStats {
  totalCampaigns: number;
  activeCampaigns: number;
  smsCampaigns: number;
  emailCampaigns: number;
  smsUsed: number;
  smsLimit: number;
  emailUsed: number;
  emailLimit: number;
}

const DEFAULT_TEMPLATE: CampaignTemplate = {
  name: "Nouvelle campagne",
  subject: null,
  body: "",
  offer: null,
  inactiveDays: null,
};

function isRecord(value: Json): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textOf(value: Json | undefined): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOf(value: Json | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseCampaignTemplate(template: Json): CampaignTemplate {
  if (!isRecord(template)) return DEFAULT_TEMPLATE;
  return {
    name: textOf(template.name) ?? DEFAULT_TEMPLATE.name,
    subject: textOf(template.subject),
    body: textOf(template.body) ?? "",
    offer: textOf(template.offer),
    inactiveDays: numberOf(template.inactiveDays),
  };
}

function withTemplate(row: CampaignRow, audienceCount = 0): CampaignWithTemplate {
  return { ...row, templateData: parseCampaignTemplate(row.template), audienceCount };
}

function serializeTemplate(template: CampaignTemplate): Json {
  return {
    name: template.name,
    subject: template.subject,
    body: template.body,
    offer: template.offer,
    inactiveDays: template.inactiveDays,
  };
}

export async function listCampaigns(): Promise<CampaignWithTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`listCampaigns: ${error.message}`);
  return attachAudienceCounts(data ?? []);
}

export async function getCampaign(id: string): Promise<CampaignWithTemplate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getCampaign: ${error.message}`);
  if (!data) return null;
  const [campaign] = await attachAudienceCounts([data]);
  return campaign ?? null;
}

export async function getLoyaltyAgentStats(): Promise<LoyaltyAgentStats> {
  const [campaigns, usage] = await Promise.all([listCampaigns(), listCurrentUsage()]);
  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.active).length,
    smsCampaigns: campaigns.filter((c) => c.channel === "sms").length,
    emailCampaigns: campaigns.filter((c) => c.channel === "email").length,
    smsUsed: usage.sms,
    smsLimit: usage.smsLimit,
    emailUsed: usage.email,
    emailLimit: usage.emailLimit,
  };
}

function currentPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

async function listCurrentUsage(): Promise<{
  sms: number;
  smsLimit: number;
  email: number;
  emailLimit: number;
}> {
  const supabase = await createClient();
  const [{ data: org }, { data, error }] = await Promise.all([
    supabase.from("organizations").select("formula").maybeSingle(),
    supabase
      .from("usage_metering")
      .select("metric, quantity")
      .eq("period", currentPeriod())
      .in("metric", ["sms", "email"]),
  ]);
  if (error) throw new Error(`listCurrentUsage: ${error.message}`);

  const formula: Formula = org?.formula ?? "starter";
  const usage = new Map<UsageMetric, number>(
    (data ?? []).map((row) => [row.metric, row.quantity]),
  );
  return {
    sms: usage.get("sms") ?? 0,
    smsLimit: limitFor(formula, "sms"),
    email: usage.get("email") ?? 0,
    emailLimit: limitFor(formula, "email"),
  };
}

async function attachAudienceCounts(rows: CampaignRow[]): Promise<CampaignWithTemplate[]> {
  if (rows.length === 0) return [];

  const supabase = await createClient();
  const [contactsRes, cardsRes] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, birthday, last_visit_at, type")
      .eq("type", "b2c"),
    supabase.from("loyalty_cards").select("*", { count: "exact", head: true }),
  ]);
  if (contactsRes.error) {
    throw new Error(`attachAudienceCounts(contacts): ${contactsRes.error.message}`);
  }
  if (cardsRes.error) {
    throw new Error(`attachAudienceCounts(cards): ${cardsRes.error.message}`);
  }

  const contacts = contactsRes.data ?? [];
  const b2cCount = contacts.length;
  const birthdayCount = contacts.filter((c) => Boolean(c.birthday)).length;
  const cardCount = cardsRes.count ?? 0;

  return rows.map((row) => {
    const template = parseCampaignTemplate(row.template);
    const inactiveDays = template.inactiveDays ?? 30;
    const inactiveCutoff = new Date();
    inactiveCutoff.setDate(inactiveCutoff.getDate() - inactiveDays);
    const inactiveCount = contacts.filter((c) => {
      if (!c.last_visit_at) return false;
      return new Date(c.last_visit_at).getTime() <= inactiveCutoff.getTime();
    }).length;

    const audienceCount =
      row.trigger === "birthday"
        ? birthdayCount
        : row.trigger === "inactive"
          ? inactiveCount
          : row.trigger === "post_purchase"
            ? cardCount
            : b2cCount;

    return withTemplate(row, audienceCount);
  });
}

export async function listRecentMessages(limit = 5): Promise<MessageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listRecentMessages: ${error.message}`);
  return data ?? [];
}

export async function createCampaign(input: CampaignInput): Promise<CampaignRow> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("createCampaign: organisation introuvable.");

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      org_id: orgId,
      trigger: input.trigger,
      channel: input.channel,
      template: serializeTemplate(input.template),
      active: input.active ?? false,
    })
    .select("*")
    .single();
  if (error) throw new Error(`createCampaign: ${error.message}`);
  return data;
}

export async function updateCampaign(
  id: string,
  input: CampaignInput,
): Promise<CampaignRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .update({
      trigger: input.trigger,
      channel: input.channel,
      template: serializeTemplate(input.template),
      active: input.active ?? false,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`updateCampaign: ${error.message}`);
  return data;
}

export async function toggleCampaign(id: string, active: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").update({ active }).eq("id", id);
  if (error) throw new Error(`toggleCampaign: ${error.message}`);
}

export async function deleteCampaign(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw new Error(`deleteCampaign: ${error.message}`);
}
