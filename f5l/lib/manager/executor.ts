import "server-only";
import { getCampaign } from "@/lib/loyalty-agent/campaigns";
import { dispatchCampaignNow, type DispatchResult } from "@/lib/loyalty-agent/dispatch";
import {
  claimManagerActionExecution,
  markManagerActionExecuted,
  restoreManagerActionApproved,
} from "@/lib/manager/approvals";
import { approveReviewResponseDraft } from "@/lib/reputation/reputation";
import { createClient } from "@/lib/supabase/server";
import type { Json, ManagerActionRequestRow } from "@/types/database";
import type { OrgContext } from "@/lib/auth/context";

export interface ExecuteManagerActionResult {
  ok: boolean;
  message: string;
  dispatch?: DispatchResult;
}

function isRecord(value: Json): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringOf(value: Json | undefined): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function audit(params: {
  orgId: string;
  action: string;
  payload: Json;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("audit_log").insert({
    org_id: params.orgId,
    agent: "manager",
    action: params.action,
    payload: params.payload,
  });
  if (error) throw new Error(`audit(${params.action}): ${error.message}`);
}

async function executeDispatchCampaign(
  ctx: OrgContext,
  request: ManagerActionRequestRow,
): Promise<ExecuteManagerActionResult> {
  if (!ctx.enabledModules.has("loyalty_agent")) {
    return {
      ok: false,
      message: "Le module Agent Fidélisation n'est pas activé pour cette organisation.",
    };
  }
  if (!isRecord(request.payload)) {
    return { ok: false, message: "Payload de demande invalide." };
  }

  const campaignId = stringOf(request.payload.campaignId);
  if (!campaignId) return { ok: false, message: "Campagne introuvable dans la demande." };

  const campaign = await getCampaign(campaignId);
  if (!campaign) return { ok: false, message: "Campagne introuvable." };
  if (!campaign.active) return { ok: false, message: "Campagne inactive." };

  const dispatch = await dispatchCampaignNow({
    campaign,
    orgId: ctx.org.id,
    orgName: ctx.org.name,
    formula: ctx.formula,
  });
  await markManagerActionExecuted(request.id);
  await audit({
    orgId: ctx.org.id,
    action: "action_executed",
    payload: {
      requestId: request.id,
      type: "dispatch_campaign",
      campaignId,
      sent: dispatch.sent,
      skipped: dispatch.skipped,
      failed: dispatch.failed,
    },
  });

  return {
    ok: true,
    message: "Campagne exécutée.",
    dispatch,
  };
}

async function executeApproveReviewResponse(
  ctx: OrgContext,
  request: ManagerActionRequestRow,
): Promise<ExecuteManagerActionResult> {
  if (!ctx.enabledModules.has("reputation")) {
    return {
      ok: false,
      message: "Le module Réputation n'est pas activé pour cette organisation.",
    };
  }
  if (!isRecord(request.payload)) {
    return { ok: false, message: "Payload de demande invalide." };
  }

  const reviewId = stringOf(request.payload.reviewId);
  if (!reviewId) return { ok: false, message: "Avis introuvable dans la demande." };

  await approveReviewResponseDraft({
    reviewId,
    approvedBy: request.reviewed_by ?? ctx.userId,
  });
  await markManagerActionExecuted(request.id);
  await audit({
    orgId: ctx.org.id,
    action: "action_executed",
    payload: {
      requestId: request.id,
      type: "approve_review_response",
      reviewId,
    },
  });

  return {
    ok: true,
    message: "Brouillon de réponse approuvé.",
  };
}

export async function executeManagerAction(
  ctx: OrgContext,
  request: ManagerActionRequestRow,
): Promise<ExecuteManagerActionResult> {
  if (request.status !== "approved") {
    return { ok: false, message: "Seules les demandes approuvées peuvent être exécutées." };
  }
  const claimed = await claimManagerActionExecution(request.id);
  if (!claimed) {
    return { ok: false, message: "Cette action est déjà en cours ou n'est plus approuvée." };
  }
  if (!isRecord(request.payload)) {
    await restoreManagerActionApproved(request.id);
    return { ok: false, message: "Payload de demande invalide." };
  }

  const type = stringOf(request.payload.type);
  try {
    if (type === "dispatch_campaign") {
      const result = await executeDispatchCampaign(ctx, request);
      if (!result.ok) await restoreManagerActionApproved(request.id);
      return result;
    }
    if (type === "approve_review_response") {
      const result = await executeApproveReviewResponse(ctx, request);
      if (!result.ok) await restoreManagerActionApproved(request.id);
      return result;
    }

    await restoreManagerActionApproved(request.id);
    return { ok: false, message: `Type d'action non supporté : ${type ?? "inconnu"}.` };
  } catch (error) {
    await restoreManagerActionApproved(request.id).catch((restoreError) => {
      console.error("[manager] restore approved impossible:", restoreError);
    });
    throw error;
  }
}
