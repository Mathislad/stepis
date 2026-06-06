"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireModule } from "@/lib/auth/require-module";
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  toggleCampaign,
  updateCampaign,
} from "@/lib/loyalty-agent/campaigns";
import { campaignApprovalDecision } from "@/lib/loyalty-agent/approval";
import { dispatchCampaignNow } from "@/lib/loyalty-agent/dispatch";
import {
  createManagerActionRequest,
  findPendingManagerActionRequest,
} from "@/lib/manager/approvals";
import { notifyManagerActionRequest } from "@/lib/brevo/notify";
import type { CampaignTrigger, Channel } from "@/types/database";

export interface CampaignFormState {
  ok: boolean;
  error: string | null;
}

const TRIGGERS: CampaignTrigger[] = [
  "birthday",
  "inactive",
  "post_purchase",
  "seasonal",
];
const CHANNELS: Channel[] = ["sms", "email", "whatsapp"];

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function optStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

function intOpt(fd: FormData, key: string): number | null {
  const raw = str(fd, key);
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export async function saveCampaignAction(
  _prev: CampaignFormState,
  fd: FormData,
): Promise<CampaignFormState> {
  await requireModule("loyalty_agent");

  const id = optStr(fd, "campaignId");
  const trigger = str(fd, "trigger") as CampaignTrigger;
  const channel = str(fd, "channel") as Channel;
  const name = str(fd, "name");
  const subject = optStr(fd, "subject");
  const body = str(fd, "body");
  const offer = optStr(fd, "offer");
  const inactiveDays = intOpt(fd, "inactiveDays");
  const active = fd.get("active") === "on";

  if (!TRIGGERS.includes(trigger)) return { ok: false, error: "Déclencheur invalide." };
  if (!CHANNELS.includes(channel)) return { ok: false, error: "Canal invalide." };
  if (!name) return { ok: false, error: "Le nom de campagne est requis." };
  if (!body) return { ok: false, error: "Le message est requis." };
  if (channel === "email" && !subject) {
    return { ok: false, error: "L'objet est requis pour un e-mail." };
  }
  if (trigger === "inactive" && (!inactiveDays || inactiveDays < 1)) {
    return { ok: false, error: "Indiquez un seuil d'inactivité valide." };
  }

  const input = {
    trigger,
    channel,
    active,
    template: {
      name,
      subject,
      body,
      offer,
      inactiveDays: trigger === "inactive" ? inactiveDays : null,
    },
  };

  try {
    if (id) await updateCampaign(id, input);
    else await createCampaign(input);
  } catch {
    return { ok: false, error: "Enregistrement impossible." };
  }

  revalidatePath("/loyalty-agent");
  redirect("/loyalty-agent");
}

export async function toggleCampaignAction(fd: FormData): Promise<void> {
  await requireModule("loyalty_agent");
  const id = str(fd, "campaignId");
  const active = str(fd, "active") === "true";
  if (id) {
    try {
      await toggleCampaign(id, active);
    } catch {
      /* best-effort */
    }
  }
  revalidatePath("/loyalty-agent");
}

export async function deleteCampaignAction(fd: FormData): Promise<void> {
  await requireModule("loyalty_agent");
  const id = str(fd, "campaignId");
  if (id) {
    try {
      await deleteCampaign(id);
    } catch {
      /* best-effort */
    }
  }
  revalidatePath("/loyalty-agent");
}

export async function runCampaignAction(fd: FormData): Promise<void> {
  const ctx = await requireModule("loyalty_agent");
  const id = str(fd, "campaignId");
  if (!id) return;

  try {
    const campaign = await getCampaign(id);
    if (!campaign || !campaign.active) return;
    const approval = campaignApprovalDecision(campaign);
    if (ctx.enabledModules.has("manager") && approval.required) {
      const existing = await findPendingManagerActionRequest({
        agent: "loyalty_agent",
        payloadKey: "campaignId",
        payloadValue: campaign.id,
      });
      if (!existing) {
        const request = await createManagerActionRequest({
          orgId: ctx.org.id,
          agent: "loyalty_agent",
          action: `Envoyer la campagne "${campaign.templateData.name}"`,
          risk: campaign.channel === "sms" ? "high" : "medium",
          requestedBy: ctx.userId,
          payload: {
            type: "dispatch_campaign",
            campaignId: campaign.id,
            campaignName: campaign.templateData.name,
            channel: campaign.channel,
            trigger: campaign.trigger,
            audienceCount: campaign.audienceCount,
            reason: approval.reason,
          },
        });
        await notifyManagerActionRequest({
          org: {
            name: ctx.org.name,
            contact_email: ctx.org.contact_email,
            contact_phone: ctx.org.contact_phone,
          },
          action: request.action,
          agent: request.agent,
          risk: request.risk,
        });
      }
      revalidatePath("/manager");
      revalidatePath("/loyalty-agent");
      return;
    }

    await dispatchCampaignNow({
      campaign,
      orgId: ctx.org.id,
      orgName: ctx.org.name,
      formula: ctx.formula,
    });
  } catch (e) {
    console.error("[loyalty_agent] runCampaignAction:", e);
  }

  revalidatePath("/loyalty-agent");
}
