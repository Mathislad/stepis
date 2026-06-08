"use server";

import { revalidatePath } from "next/cache";
import { requireModule } from "@/lib/auth/require-module";
import { anthropicConfigured } from "@/lib/anthropic/client";
import { notifyManagerActionRequest } from "@/lib/brevo/notify";
import {
  createManagerActionRequest,
  findPendingManagerActionRequest,
} from "@/lib/manager/approvals";
import { generateReviewResponseDraft } from "@/lib/reputation/ai";
import { dispatchQueuedReviewRequests } from "@/lib/reputation/dispatch";
import {
  getReview,
  markFeedbackHandled,
  queueReviewRequests,
  saveReviewResponseDraft,
} from "@/lib/reputation/reputation";
import { createClient } from "@/lib/supabase/server";
import type { Channel, Json, UsageMetric } from "@/types/database";

const CHANNELS: Channel[] = ["sms", "email"];

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function currentPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function riskFromRating(rating: number | null): "low" | "medium" | "high" {
  if (typeof rating !== "number") return "medium";
  if (rating <= 2) return "high";
  if (rating === 3) return "medium";
  return "low";
}

async function audit(params: { orgId: string; action: string; payload: Json }): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("audit_log").insert({
    org_id: params.orgId,
    agent: "reputation",
    action: params.action,
    payload: params.payload,
  });
  if (error) throw new Error(`audit(${params.action}): ${error.message}`);
}

async function incrementUsage(params: {
  orgId: string;
  metric: UsageMetric;
  quantity: number;
}): Promise<void> {
  if (params.quantity <= 0) return;
  const supabase = await createClient();
  const period = currentPeriod();
  const { data: existing, error: readError } = await supabase
    .from("usage_metering")
    .select("id, quantity")
    .eq("period", period)
    .eq("metric", params.metric)
    .maybeSingle();
  if (readError) throw new Error(`incrementUsage(read): ${readError.message}`);

  if (existing) {
    const { error } = await supabase
      .from("usage_metering")
      .update({ quantity: existing.quantity + params.quantity })
      .eq("id", existing.id);
    if (error) throw new Error(`incrementUsage(update): ${error.message}`);
    return;
  }

  const { error } = await supabase.from("usage_metering").insert({
    org_id: params.orgId,
    period,
    metric: params.metric,
    quantity: params.quantity,
  });
  if (error) throw new Error(`incrementUsage(insert): ${error.message}`);
}

export async function queueReviewRequestsAction(fd: FormData): Promise<void> {
  const ctx = await requireModule("reputation");
  const channel = str(fd, "channel") as Channel;
  if (!CHANNELS.includes(channel)) return;
  try {
    const requestIds = await queueReviewRequests(channel);
    await dispatchQueuedReviewRequests({
      orgName: ctx.org.name,
      requestIds,
    });
  } catch (e) {
    console.error("[reputation] queueReviewRequestsAction:", e);
  }
  revalidatePath("/reputation");
}

export async function markFeedbackHandledAction(fd: FormData): Promise<void> {
  await requireModule("reputation");
  const id = str(fd, "feedbackId");
  if (!id) return;
  try {
    await markFeedbackHandled(id);
  } catch (e) {
    console.error("[reputation] markFeedbackHandledAction:", e);
  }
  revalidatePath("/reputation");
}

export async function generateReviewResponseDraftAction(fd: FormData): Promise<void> {
  const ctx = await requireModule("reputation");
  const reviewId = str(fd, "reviewId");
  if (!reviewId) return;
  if (!anthropicConfigured()) {
    console.warn("[reputation] Anthropic non configuré — brouillon ignoré.");
    revalidatePath("/reputation");
    return;
  }

  try {
    const review = await getReview(reviewId);
    if (!review) return;
    const result = await generateReviewResponseDraft({
      orgName: ctx.org.name,
      review,
    });
    await saveReviewResponseDraft({ reviewId, draft: result.draft });
    await audit({
      orgId: ctx.org.id,
      action: "review_response_draft_generated",
      payload: {
        reviewId,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      },
    });
    await incrementUsage({
      orgId: ctx.org.id,
      metric: "ai_tokens",
      quantity: result.inputTokens + result.outputTokens,
    }).catch((error) => {
      console.error("[reputation] metering IA échoué:", error);
    });
  } catch (e) {
    console.error("[reputation] generateReviewResponseDraftAction:", e);
    await audit({
      orgId: ctx.org.id,
      action: "review_response_draft_failed",
      payload: { reviewId, message: e instanceof Error ? e.message : "Erreur inconnue" },
    }).catch((auditError) => {
      console.error("[reputation] audit échec brouillon impossible:", auditError);
    });
  }
  revalidatePath("/reputation");
}

export async function requestReviewResponseApprovalAction(fd: FormData): Promise<void> {
  const ctx = await requireModule("reputation");
  const reviewId = str(fd, "reviewId");
  if (!reviewId || !ctx.enabledModules.has("manager")) return;

  try {
    const review = await getReview(reviewId);
    if (!review?.response_draft) return;
    const existing = await findPendingManagerActionRequest({
      agent: "reputation",
      payloadKey: "reviewId",
      payloadValue: reviewId,
    });
    if (existing) {
      revalidatePath("/manager");
      revalidatePath("/reputation");
      return;
    }

    const request = await createManagerActionRequest({
      orgId: ctx.org.id,
      agent: "reputation",
      action: "approve_review_response",
      risk: riskFromRating(review.rating),
      requestedBy: ctx.userId,
      payload: {
        type: "approve_review_response",
        reviewId,
        rating: review.rating,
        authorName: review.author_name,
        source: review.source,
        draft: review.response_draft,
      },
    });
    await audit({
      orgId: ctx.org.id,
      action: "review_response_approval_requested",
      payload: { requestId: request.id, reviewId },
    });
    await notifyManagerActionRequest({
      org: ctx.org,
      agent: "Réputation",
      action: "Réponse à avis à valider",
      risk: request.risk,
    }).catch((error) => {
      console.error("[reputation] notification Manager échouée:", error);
    });
  } catch (e) {
    console.error("[reputation] requestReviewResponseApprovalAction:", e);
  }
  revalidatePath("/manager");
  revalidatePath("/reputation");
}
