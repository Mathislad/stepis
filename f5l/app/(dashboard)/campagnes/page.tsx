import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-module";
import { listAdCampaigns } from "@/lib/acquisition/campaigns";
import { getAcquisitionStats } from "@/lib/acquisition/stats";
import { OBJECTIVE_LABELS, STATUS_LABELS, STATUS_TONES } from "@/lib/acquisition/labels";
import { Badge } from "@/components/ui/Badge";
import { formatEuro } from "@/lib/utils";

export const metadata = { title: "Mes campagnes — F5L" };

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "meta") return <span title="Meta">📘</span>;
  if (platform === "google") return <span title="Google">🔎</span>;
  return <span title="Meta + Google">🌐</span>;
}

export default async function CampagnesPage() {
  await requireAuth();
  const [campaigns, stats] = await Promise.all([listAdCampaigns(), getAcquisitionStats()]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mes campagnes</h1>
          <p className="text-sm text-[var(--text-2)]">
            Vos publicités qui attirent des prospects.
          </p>
        </div>
        <Link href="/campagnes/nouvelle" className="btn btn-primary">
          + Nouvelle campagne
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Campagnes" value={stats.totalCampaigns} />
        <Stat label="Actives" value={stats.activeCampaigns} accent />
        <Stat label="Budget total" value={formatEuro(stats.totalBudget)} />
        <Stat label="Prospects générés" value={stats.totalLeads} accent />
      </div>

      {campaigns.length === 0 ? (
        <div className="surface flex flex-col items-center gap-2 px-5 py-14 text-center">
          <p className="text-3xl">📢</p>
          <p className="font-medium">Aucune campagne pour l&apos;instant</p>
          <p className="max-w-sm text-sm text-[var(--text-2)]">
            Lancez votre première campagne — la plupart de nos clients reçoivent leurs premiers
            prospects sous 48 h.
          </p>
          <Link href="/campagnes/nouvelle" className="btn btn-primary mt-2">
            Lancer ma 1re campagne
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {campaigns.map((c) => (
            <li key={c.id} className="surface surface-hover p-4">
              <Link href={`/campagnes/${c.id}`} className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <PlatformIcon platform={c.platform} />
                    <span className="truncate font-medium">{c.title}</span>
                    <Badge tone={STATUS_TONES[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-[var(--text-2)]">
                    {OBJECTIVE_LABELS[c.objective]} · Budget {formatEuro(Number(c.budget))} ·{" "}
                    {c.duration_days} jours
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

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="surface p-4">
      <p
        className="text-2xl font-semibold tabular-nums"
        style={accent ? { color: "var(--blue)" } : undefined}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[12px] text-[var(--text-2)]">{label}</p>
    </div>
  );
}
