import { createClient } from "@/lib/supabase/server";
import { anthropicConfigured } from "@/lib/anthropic/client";
import { limitFor } from "@/lib/usage/limits";
import type {
  AuditLogRow,
  DailyDigestRow,
  Formula,
  Json,
  ManagerActionRequestRow,
  ManagerAiSummary,
  UsageMetric,
} from "@/types/database";

export interface UsageSnapshot {
  metric: UsageMetric;
  quantity: number;
  limit: number;
}

export interface ManagerSnapshot {
  today: DailyDigestRow | null;
  recentDigests: DailyDigestRow[];
  recentAuditLogs: AuditLogRow[];
  usage: UsageSnapshot[];
  actionRequests: ManagerActionRequestRow[];
  briefing: ManagerBriefing;
  managerAi: ManagerAiSummary | null;
  aiConfigured: boolean;
}

export interface ManagerBriefing {
  headline: string;
  actions: string[];
  alerts: string[];
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function isRecord(value: Json): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberOf(value: Json | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringOf(value: Json | undefined): string {
  return typeof value === "string" ? value : "";
}

function stringArrayOf(value: Json | undefined): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function managerAiSummary(digest: DailyDigestRow | null): ManagerAiSummary | null {
  if (!digest || !isRecord(digest.summary)) return null;
  const raw = digest.summary.manager_ai;
  if (!raw || !isRecord(raw)) return null;
  const usage = raw.usage && isRecord(raw.usage) ? raw.usage : {};

  return {
    generatedAt: stringOf(raw.generatedAt),
    model: stringOf(raw.model),
    briefing: stringOf(raw.briefing),
    priorities: stringArrayOf(raw.priorities),
    risks: stringArrayOf(raw.risks),
    opportunities: stringArrayOf(raw.opportunities),
    nextActions: stringArrayOf(raw.nextActions),
    confidence: stringOf(raw.confidence) || "medium",
    usage: {
      inputTokens: numberOf(usage.inputTokens),
      outputTokens: numberOf(usage.outputTokens),
    },
  };
}

function loyaltySummary(digest: DailyDigestRow | null): {
  campaigns: number;
  sent: number;
  skipped: number;
  failed: number;
} {
  if (!digest || !isRecord(digest.summary)) {
    return { campaigns: 0, sent: 0, skipped: 0, failed: 0 };
  }
  const raw = digest.summary.loyalty_agent;
  if (!raw || !isRecord(raw)) {
    return { campaigns: 0, sent: 0, skipped: 0, failed: 0 };
  }
  return {
    campaigns: numberOf(raw.campaigns),
    sent: numberOf(raw.sent),
    skipped: numberOf(raw.skipped),
    failed: numberOf(raw.failed),
  };
}

function managerSummary(digest: DailyDigestRow | null): {
  requested: number;
  approved: number;
  rejected: number;
  executed: number;
  failed: number;
} {
  if (!digest || !isRecord(digest.summary)) {
    return { requested: 0, approved: 0, rejected: 0, executed: 0, failed: 0 };
  }
  const raw = digest.summary.manager;
  if (!raw || !isRecord(raw)) {
    return { requested: 0, approved: 0, rejected: 0, executed: 0, failed: 0 };
  }
  return {
    requested: numberOf(raw.requested),
    approved: numberOf(raw.approved),
    rejected: numberOf(raw.rejected),
    executed: numberOf(raw.executed),
    failed: numberOf(raw.failed),
  };
}

function buildBriefing(params: {
  todayDigest: DailyDigestRow | null;
  usage: UsageSnapshot[];
  auditLogs: AuditLogRow[];
}): ManagerBriefing {
  const loyalty = loyaltySummary(params.todayDigest);
  const manager = managerSummary(params.todayDigest);
  const usageAlerts = params.usage
    .filter((row) => row.limit > 0 && row.quantity / row.limit >= 0.8)
    .map((row) => `${row.metric} : ${row.quantity}/${row.limit} utilisés ce mois-ci.`);

  const failedLogs = params.auditLogs.filter((log) => {
    if (!isRecord(log.payload)) return false;
    return numberOf(log.payload.failed) > 0;
  });

  const headline =
    loyalty.campaigns > 0
      ? `Aujourd'hui : ${loyalty.campaigns} campagne(s) fidélisation, ${loyalty.sent} message(s) envoyé(s), ${loyalty.skipped} ignoré(s).`
      : "Aujourd'hui : aucun agent n'a encore produit de résumé exploitable.";

  const actions = [
    manager.requested > manager.approved + manager.rejected
      ? `${manager.requested - manager.approved - manager.rejected} validation(s) Manager à traiter.`
      : null,
    manager.approved > manager.executed
      ? `${manager.approved - manager.executed} action(s) approuvée(s) à exécuter.`
      : null,
    loyalty.failed > 0
      ? `${loyalty.failed} envoi(s) fidélisation ont échoué : vérifier Brevo et les coordonnées clients.`
      : null,
    loyalty.skipped > 0
      ? `${loyalty.skipped} contact(s) ignoré(s) : doublon, quota ou canal non supporté.`
      : null,
    params.todayDigest
      ? "Digest du jour prêt pour lecture."
      : "Attendre le prochain cron ou lancer l'Agent Fidélisation manuellement.",
  ].filter((action): action is string => Boolean(action));

  const alerts = [
    ...usageAlerts,
    manager.failed > 0 ? `${manager.failed} exécution(s) Manager ont échoué aujourd'hui.` : null,
    ...failedLogs.map((log) => `${log.agent} a signalé un échec sur ${log.action}.`),
  ].filter((alert): alert is string => Boolean(alert));

  return { headline, actions, alerts };
}

export async function getManagerSnapshot(): Promise<ManagerSnapshot> {
  const supabase = await createClient();
  const period = currentPeriod();
  const [
    { data: org },
    { data: todayDigest, error: todayError },
    { data: recentDigests, error: digestError },
    { data: recentAuditLogs, error: auditError },
    { data: usageRows, error: usageError },
    { data: actionRequests, error: actionError },
  ] = await Promise.all([
    supabase.from("organizations").select("formula").maybeSingle(),
    supabase.from("daily_digest").select("*").eq("digest_date", today()).maybeSingle(),
    supabase
      .from("daily_digest")
      .select("*")
      .order("digest_date", { ascending: false })
      .limit(7),
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(12),
    supabase
      .from("usage_metering")
      .select("*")
      .eq("period", period)
      .in("metric", ["sms", "email", "ai_tokens", "call_minutes"]),
    supabase
      .from("manager_action_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  if (todayError) throw new Error(`getManagerSnapshot(today): ${todayError.message}`);
  if (digestError) throw new Error(`getManagerSnapshot(digests): ${digestError.message}`);
  if (auditError) throw new Error(`getManagerSnapshot(audit): ${auditError.message}`);
  if (usageError) throw new Error(`getManagerSnapshot(usage): ${usageError.message}`);
  if (actionError) throw new Error(`getManagerSnapshot(actions): ${actionError.message}`);

  const formula: Formula = org?.formula ?? "starter";
  const usage = (usageRows ?? []).map((row) => ({
    metric: row.metric,
    quantity: row.quantity,
    limit: limitFor(formula, row.metric),
  }));
  const auditLogs = recentAuditLogs ?? [];
  const todayRow = todayDigest ?? null;

  return {
    today: todayRow,
    recentDigests: recentDigests ?? [],
    recentAuditLogs: auditLogs,
    usage,
    actionRequests: actionRequests ?? [],
    briefing: buildBriefing({ todayDigest: todayRow, usage, auditLogs }),
    managerAi: managerAiSummary(todayRow),
    aiConfigured: anthropicConfigured(),
  };
}
