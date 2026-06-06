import type { CrmStats } from "@/lib/crm/stats";

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className="surface p-4"
      style={accent ? { borderColor: "rgba(10,132,255,0.35)" } : undefined}
    >
      <p
        className="text-2xl font-semibold tabular-nums"
        style={accent ? { color: "var(--blue)" } : undefined}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[12px] leading-tight text-[var(--text-2)]">{label}</p>
    </div>
  );
}

/** Bandeau de stats CRM, dont le compteur ROI « amenés par F5L ». */
export function StatsBar({ stats }: { stats: CrmStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Contacts" value={stats.total} />
      <Stat label="Professionnels (B2B)" value={stats.b2b} />
      <Stat label="Particuliers (B2C)" value={stats.b2c} />
      <Stat label="Clients amenés par F5L" value={stats.f5lAcquired} accent />
    </div>
  );
}
