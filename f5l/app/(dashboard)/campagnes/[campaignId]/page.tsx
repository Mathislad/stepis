// Réutilise la page de détail acquisition existante avec terminologie F5L Acquisition.
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-module";
import { getAdCampaignWithReports } from "@/lib/acquisition/campaigns";
import {
  OBJECTIVE_LABELS,
  PLATFORM_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
} from "@/lib/acquisition/labels";
import {
  deleteAdCampaignAction,
  updateAdCampaignStatusAction,
} from "@/lib/acquisition/actions";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { formatDate, formatEuro } from "@/lib/utils";
import type { AdCampaignStatus } from "@/types/database";

export const metadata = { title: "Campagne — F5L" };

const ACTIONS_FOR_STATUS: Record<AdCampaignStatus, { next: AdCampaignStatus; label: string }[]> = {
  draft: [{ next: "active", label: "Lancer" }],
  active: [
    { next: "paused", label: "Mettre en pause" },
    { next: "completed", label: "Terminer" },
  ],
  paused: [
    { next: "active", label: "Reprendre" },
    { next: "completed", label: "Terminer" },
  ],
  completed: [],
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  await requireAuth();
  const { campaignId } = await params;
  const result = await getAdCampaignWithReports(campaignId);
  if (!result) notFound();
  const { campaign, reports } = result;

  const totals = reports.reduce(
    (acc, r) => ({
      impressions: acc.impressions + r.impressions,
      clicks: acc.clicks + r.clicks,
      leads: acc.leads + r.leads_count,
      spend: acc.spend + Number(r.spend),
    }),
    { impressions: 0, clicks: 0, leads: 0, spend: 0 },
  );
  const cpl = totals.leads > 0 ? totals.spend / totals.leads : null;
  const ctr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(1) : "—";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/campagnes" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Mes campagnes
        </Link>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">{campaign.title}</h1>
            <p className="text-sm text-[var(--text-2)]">
              {OBJECTIVE_LABELS[campaign.objective]} · {PLATFORM_LABELS[campaign.platform]}
            </p>
          </div>
          <Badge tone={STATUS_TONES[campaign.status]}>{STATUS_LABELS[campaign.status]}</Badge>
        </div>
      </div>

      {/* La performance d'abord — c'est ce que le client veut voir */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Prospects" value={totals.leads} accent="green" />
        <Stat label="Coût / prospect" value={cpl != null ? formatEuro(cpl) : "—"} />
        <Stat label="Dépensé" value={formatEuro(totals.spend)} />
        <Stat label="Taux de clic" value={`${ctr}%`} />
      </section>

      {campaign.ad_copy && (
        <section className="surface p-5">
          <p className="mb-1 text-[12px] uppercase tracking-wider text-[var(--muted)]">
            Votre annonce
          </p>
          <div className="rounded-lg border border-[var(--border)] bg-white p-4 text-black">
            <p className="text-sm">{campaign.ad_copy}</p>
          </div>
        </section>
      )}

      <section className="flex flex-wrap items-center gap-2">
        {ACTIONS_FOR_STATUS[campaign.status].map((a) => (
          <form key={a.next} action={updateAdCampaignStatusAction}>
            <input type="hidden" name="campaignId" value={campaign.id} />
            <input type="hidden" name="status" value={a.next} />
            <button
              type="submit"
              className={a.next === "active" ? "btn btn-primary" : "btn btn-ghost"}
            >
              {a.label}
            </button>
          </form>
        ))}
        <form action={deleteAdCampaignAction}>
          <input type="hidden" name="campaignId" value={campaign.id} />
          <ConfirmButton
            message="Supprimer cette campagne ?"
            className="btn btn-ghost"
            style={{ color: "var(--red)" }}
          >
            Supprimer
          </ConfirmButton>
        </form>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-[var(--text-2)]">Performance jour par jour</h2>
        {reports.length === 0 ? (
          <p className="surface p-6 text-center text-sm text-[var(--text-2)]">
            Aucune donnée pour le moment. Les chiffres arrivent dès que la campagne est active.
          </p>
        ) : (
          <div className="surface overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[12px] text-[var(--muted)]">
                  <th className="p-2.5 font-medium">Date</th>
                  <th className="p-2.5 text-right font-medium">Impressions</th>
                  <th className="p-2.5 text-right font-medium">Clics</th>
                  <th className="p-2.5 text-right font-medium">Prospects</th>
                  <th className="p-2.5 text-right font-medium">Dépense</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--border)]">
                    <td className="p-2.5 text-[var(--text-2)]">{formatDate(r.report_date)}</td>
                    <td className="p-2.5 text-right tabular-nums">{r.impressions}</td>
                    <td className="p-2.5 text-right tabular-nums">{r.clicks}</td>
                    <td
                      className="p-2.5 text-right tabular-nums font-semibold"
                      style={{ color: r.leads_count > 0 ? "var(--green)" : undefined }}
                    >
                      {r.leads_count}
                    </td>
                    <td className="p-2.5 text-right tabular-nums">{formatEuro(Number(r.spend))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "green" | "blue";
}) {
  const color = accent === "green" ? "var(--green)" : accent === "blue" ? "var(--blue)" : "var(--text)";
  return (
    <div className="surface p-4">
      <p className="text-2xl font-semibold tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="mt-0.5 text-[12px] text-[var(--text-2)]">{label}</p>
    </div>
  );
}
