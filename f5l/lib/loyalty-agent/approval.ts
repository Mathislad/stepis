import type { CampaignWithTemplate } from "@/lib/loyalty-agent/campaigns";

export interface CampaignApprovalDecision {
  required: boolean;
  reason: string | null;
}

export function campaignApprovalDecision(
  campaign: CampaignWithTemplate,
): CampaignApprovalDecision {
  if (campaign.channel === "whatsapp") {
    return {
      required: true,
      reason: "WhatsApp n'est pas encore branché en envoi réel.",
    };
  }
  if (campaign.channel === "sms") {
    return {
      required: true,
      reason: "Les SMS consomment du quota payant et contactent directement les clients.",
    };
  }
  if (campaign.audienceCount >= 25) {
    return {
      required: true,
      reason: "Audience supérieure ou égale à 25 contacts.",
    };
  }
  return { required: false, reason: null };
}
