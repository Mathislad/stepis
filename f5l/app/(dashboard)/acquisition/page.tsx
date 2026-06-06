import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { listAdCampaigns } from "@/lib/acquisition/campaigns";
import { getAcquisitionStats } from "@/lib/acquisition/stats";
import { OBJECTIVE_LABELS, STATUS_LABELS, STATUS_TONES } from "@/lib/acquisition/labels";
import { Badge } from "@/components/ui/Badge";
import { formatEuro } from "@/lib/utils";

export const metadata = { title: "Acquisition" };

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="surface p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[12px] text-[var(--text-2)]">{label}</p>
    </div>
  );
}

export default async function AcquisitionPage() {
  await requireModule("acquisition");
  const [stats, campaigns] = await Promise.all([getAcquisitionStats(), listAdCampaigns()]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Publicité</h1>
          <p className="text-sm text-[var(--text-2)]">Campagnes Meta et Google</p>
        </div>
        <Link href="/acquisition/new" className="btn btn-primary">
          + Nouvelle campagne
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Campagnes" value={stats.totalCampaigns} />
        <Stat label="Actives" value={stats.activeCampaigns} />
        <Stat label="Budget total" value={formatEuro(stats.totalBudget)} />
        <Stat label="Leads générés" value={stats.totalLeads} />
      </div>

      {campaigns.length === 0 ? (
        <div className="surface flex flex-col items-center gap-2 px-5 py-14 text-center">
          <p className="text-3xl">📣</p>
          <p className="font-medium">Aucune campagne</p>
          <p className="max-w-xs text-sm text-[var(--text-2)]">
            Créez votre première campagne publicitaire pour attirer de nouveaux clients.
          </p>
          <Link href="/acquisition/new" className="btn btn-primary mt-2">
            + Nouvelle campagne
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {campaigns.map((c) => (
            <li key={c.id} className="surface surface-hover p-4">
              <Link href={`/acquisition/${c.id}`} className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{c.title}</span>
                    <Badge tone={STATUS_TONES[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-[var(--text-2)]">
                    {OBJECTIVE_LABELS[c.objective]} · {formatEuro(Number(c.budget))} · {c.duration_days} jours
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
