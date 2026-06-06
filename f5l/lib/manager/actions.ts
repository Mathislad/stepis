"use server";

import { revalidatePath } from "next/cache";
import { requireModule } from "@/lib/auth/require-module";
import { createClient } from "@/lib/supabase/server";
import { anthropicConfigured } from "@/lib/anthropic/client";
import { reviewManagerActionRequest } from "@/lib/manager/approvals";
import { getManagerSnapshot } from "@/lib/manager/digest";
import { executeManagerAction } from "@/lib/manager/executor";
import { generateManagerAiSummary, managerAiToJson } from "@/lib/manager/ai";
import { writeManagerTrail } from "@/lib/manager/trail";
import type { Json, UsageMetric } from "@/types/database";

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

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

async function incrementUsage(params: {
  orgId: string;
  metric: UsageMetric;
  quantity: number;
}): Promise<void> {
  const { metric, quantity } = params;
  if (quantity <= 0) return;
  const supabase = await createClient();
  const period = currentPeriod();

  const { data: existing, error: readError } = await supabase
    .from("usage_metering")
    .select("id, quantity")
    .eq("period", period)
    .eq("metric", metric)
    .maybeSingle();
  if (readError) throw new Error(`incrementUsage(read): ${readError.message}`);

  if (existing) {
    const { error } = await supabase
      .from("usage_metering")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id);
    if (error) throw new Error(`incrementUsage(update): ${error.message}`);
    return;
  }

  const { error } = await supabase.from("usage_metering").insert({
    org_id: params.orgId,
    period,
    metric,
    quantity,
  });
  if (error) throw new Error(`incrementUsage(insert): ${error.message}`);
}

async function auditManagerFailure(orgId: string, error: unknown): Promise<void> {
  const supabase = await createClient();
  const message = error instanceof Error ? error.message : "Erreur inconnue";
  await supabase.from("audit_log").insert({
    org_id: orgId,
    agent: "manager",
    action: "ai_briefing_failed",
    payload: { message },
  });
}

export async function generateManagerBriefingAction(): Promise<void> {
  const ctx = await requireModule("manager");
  if (!anthropicConfigured()) {
    console.warn("[manager] Anthropic non configuré — synthèse IA ignorée.");
    revalidatePath("/manager");
    return;
  }

  const supabase = await createClient();
  try {
    const snapshot = await getManagerSnapshot();
    const aiSummary = await generateManagerAiSummary(snapshot);
    const digestDate = today();
    const { data: existing, error: readError } = await supabase
      .from("daily_digest")
      .select("summary")
      .eq("digest_date", digestDate)
      .maybeSingle();
    if (readError) throw new Error(`generateManagerBriefing(read): ${readError.message}`);

    const previous = existing && isRecord(existing.summary) ? existing.summary : {};
    const summary: Json = {
      ...previous,
      manager_ai: managerAiToJson(aiSummary),
    };

    const { error: digestError } = await supabase.from("daily_digest").upsert(
      {
        org_id: ctx.org.id,
        digest_date: digestDate,
        summary,
      },
      { onConflict: "org_id,digest_date" },
    );
    if (digestError) throw new Error(`generateManagerBriefing(upsert): ${digestError.message}`);

    const { error: auditError } = await supabase.from("audit_log").insert({
      org_id: ctx.org.id,
      agent: "manager",
      action: "ai_briefing",
      payload: {
        model: aiSummary.model,
        inputTokens: aiSummary.usage.inputTokens,
        outputTokens: aiSummary.usage.outputTokens,
      },
    });
    if (auditError) throw new Error(`generateManagerBriefing(audit): ${auditError.message}`);

    try {
      await incrementUsage({
        orgId: ctx.org.id,
        metric: "ai_tokens",
        quantity: aiSummary.usage.inputTokens + aiSummary.usage.outputTokens,
      });
    } catch (error) {
      console.error("[manager] metering IA échoué:", error);
    }
  } catch (error) {
    console.error("[manager] generateManagerBriefingAction:", error);
    await auditManagerFailure(ctx.org.id, error).catch((auditError) => {
      console.error("[manager] audit échec IA impossible:", auditError);
    });
  }
  revalidatePath("/manager");
}

export async function approveManagerActionAction(fd: FormData): Promise<void> {
  const ctx = await requireModule("manager");
  const id = str(fd, "requestId");
  if (!id) return;

  try {
    await reviewManagerActionRequest({ id, status: "approved", reviewedBy: ctx.userId });
    const supabase = await createClient();
    await supabase.from("audit_log").insert({
      org_id: ctx.org.id,
      agent: "manager",
      action: "action_approved",
      payload: { requestId: id },
    });
  } catch (error) {
    console.error("[manager] approveManagerActionAction:", error);
  }
  revalidatePath("/manager");
}

export async function rejectManagerActionAction(fd: FormData): Promise<void> {
  const ctx = await requireModule("manager");
  const id = str(fd, "requestId");
  if (!id) return;

  try {
    await reviewManagerActionRequest({ id, status: "rejected", reviewedBy: ctx.userId });
    const supabase = await createClient();
    await supabase.from("audit_log").insert({
      org_id: ctx.org.id,
      agent: "manager",
      action: "action_rejected",
      payload: { requestId: id },
    });
  } catch (error) {
    console.error("[manager] rejectManagerActionAction:", error);
  }
  revalidatePath("/manager");
}

export async function executeManagerActionAction(fd: FormData): Promise<void> {
  const ctx = await requireModule("manager");
  const id = str(fd, "requestId");
  if (!id) return;

  const supabase = await createClient();
  try {
    const { data: request, error } = await supabase
      .from("manager_action_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`executeManagerAction(read): ${error.message}`);
    if (!request) return;

    const result = await executeManagerAction(ctx, request);
    if (!result.ok) {
      await supabase.from("audit_log").insert({
        org_id: ctx.org.id,
        agent: "manager",
        action: "action_execution_failed",
        payload: { requestId: id, message: result.message },
      });
      await writeManagerTrail({
        orgId: ctx.org.id,
        event: "failed",
        requestId: id,
        agent: request.agent,
      });
    }
  } catch (error) {
    console.error("[manager] executeManagerActionAction:", error);
    await supabase.from("audit_log").insert({
      org_id: ctx.org.id,
      agent: "manager",
      action: "action_execution_failed",
      payload: {
        requestId: id,
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
    });
    await writeManagerTrail({
      orgId: ctx.org.id,
      event: "failed",
      requestId: id,
      agent: "manager",
    }).catch((trailError) => {
      console.error("[manager] trail échec exécution impossible:", trailError);
    });
  }
  revalidatePath("/manager");
  revalidatePath("/loyalty-agent");
  revalidatePath("/reputation");
}
