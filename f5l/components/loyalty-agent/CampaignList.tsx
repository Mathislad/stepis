import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { campaignApprovalDecision } from "@/lib/loyalty-agent/approval";
import {
  deleteCampaignAction,
  runCampaignAction,
  toggleCampaignAction,
} from "@/lib/loyalty-agent/actions";
import type { CampaignWithTemplate } from "@/lib/loyalty-agent/campaigns";
import type { CampaignTrigger, Channel } from "@/types/database";

const TRIGGER_LABELS: Record<CampaignTrigger, string> = {
  birthday: "Anniversaire",
  inactive: "Inactivité",
  post_purchase: "Post-achat",
  seasonal: "Saisonnier",
};

const CHANNEL_LABELS: Record<Channel, string> = {
  sms: "SMS",
  email: "E-mail",
  whatsapp: "WhatsApp",
};

const CHANNEL_TONES: Record<Channel, BadgeTone> = {
  sms: "blue",
  email: "violet",
  whatsapp: "green",
};

export function CampaignList({
  campaigns,
  managerEnabled,
}: {
  campaigns: CampaignWithTemplate[];
  managerEnabled: boolean;
}) {
  if (campaigns.length === 0) {
    return (
      <div className="surface p-6 text-center text-sm text-[var(--text-2)]">
        Aucune campagne de fidélisation.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {campaigns.map((campaign) => {
        const approval = managerEnabled
          ? campaignApprovalDecision(campaign)
          : { required: false, reason: null };
        return (
          <li key={campaign.id} className="surface flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{campaign.templateData.name}</span>
                  <Badge tone={campaign.active ? "green" : "neutral"}>
                    {campaign.active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge tone={CHANNEL_TONES[campaign.channel]}>
                    {CHANNEL_LABELS[campaign.channel]}
                  </Badge>
                  {approval.required && <Badge tone="amber">Validation Manager</Badge>}
                </div>
                <p className="mt-1 text-[13px] text-[var(--text-2)]">
                  {TRIGGER_LABELS[campaign.trigger]}
                  {campaign.templateData.inactiveDays
                    ? ` · ${campaign.templateData.inactiveDays} jours`
                    : ""}
                  {` · ${campaign.audienceCount} contact${
                    campaign.audienceCount > 1 ? "s" : ""
                  } estimé${campaign.audienceCount > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <form action={toggleCampaignAction}>
                  <input type="hidden" name="campaignId" value={campaign.id} />
                  <input type="hidden" name="active" value={(!campaign.active).toString()} />
                  <button type="submit" className="btn btn-ghost px-3 py-1.5 text-[13px]">
                    {campaign.active ? "Désactiver" : "Activer"}
                  </button>
                </form>
                {campaign.active && (
                  <form action={runCampaignAction}>
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <ConfirmButton
                      message={
                        approval.required
                          ? "Créer une demande de validation Manager pour cette campagne ?"
                          : "Envoyer cette campagne aux contacts éligibles maintenant ?"
                      }
                      className="btn btn-ghost px-3 py-1.5 text-[13px]"
                    >
                      {approval.required ? "Demander validation" : "Envoyer"}
                    </ConfirmButton>
                  </form>
                )}
                <Link
                  href={`/loyalty-agent?edit=${campaign.id}`}
                  className="btn btn-ghost px-3 py-1.5 text-[13px]"
                >
                  Éditer
                </Link>
                <form action={deleteCampaignAction}>
                  <input type="hidden" name="campaignId" value={campaign.id} />
                  <ConfirmButton
                    message="Supprimer cette campagne ?"
                    className="btn btn-ghost px-3 py-1.5 text-[13px]"
                    style={{ color: "var(--red)" }}
                  >
                    Suppr.
                  </ConfirmButton>
                </form>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-black/20 p-3">
              {campaign.templateData.subject && (
                <p className="mb-1 text-[12px] font-medium text-[var(--text-2)]">
                  {campaign.templateData.subject}
                </p>
              )}
              <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
                {campaign.templateData.body}
              </p>
              {campaign.templateData.offer && (
                <p className="mt-2 text-[12px]" style={{ color: "var(--amber)" }}>
                  Offre : {campaign.templateData.offer}
                </p>
              )}
              {approval.required && approval.reason && (
                <p className="mt-2 text-[12px] text-[var(--text-2)]">
                  Validation requise : {approval.reason}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
