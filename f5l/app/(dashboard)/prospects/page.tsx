import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-module";
import { listLeads } from "@/lib/crm/leads";
import { getCrmStats } from "@/lib/crm/stats";
import { Badge } from "@/components/ui/Badge";
import { leadSourceLabel } from "@/lib/dashboard/acquisition-metrics";
import type { LeadStatus } from "@/types/database";

export const metadata = { title: "Mes prospects — F5L" };

const PROSPECT_STAGES = [
  { key: "new", label: "Nouveau", tone: "blue" as const },
  { key: "contacted", label: "Contacté", tone: "amber" as const },
  // « RDV pris » mappe sur le statut `qualified` côté contacts.
  { key: "rdv", label: "RDV pris", tone: "violet" as const },
  { key: "converted", label: "Client", tone: "green" as const },
  { key: "lost", label: "Perdu", tone: "neutral" as const },
];

function relativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  const filter = sp.filter; // "new" | undefined

  const [leads, stats] = await Promise.all([
    listLeads(filter === "new" ? { status: "new" } : undefined),
    getCrmStats(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mes prospects</h1>
          <p className="text-sm text-[var(--text-2)]">
            Les personnes qui ont demandé à vous parler.
          </p>
        </div>
      </header>

      {/* Compteur ROI - le chiffre qui justifie F5L */}
      <section
        className="surface flex items-center justify-between gap-4 p-4"
        style={{ borderColor: "rgba(48,209,88,0.35)", background: "rgba(48,209,88,0.04)" }}
      >
        <div>
          <p className="text-[12px] uppercase tracking-wider" style={{ color: "var(--green)" }}>
            Amenés par F5L
          </p>
          <p className="mt-1 text-[28px] font-semibold tabular-nums" style={{ color: "var(--green)" }}>
            {stats.f5lAcquired}
          </p>
          <p className="text-[13px] text-[var(--text-2)]">
            clients gagnés via vos campagnes et votre page
          </p>
        </div>
        <Link href="/campagnes" className="btn btn-ghost">
          Voir mes campagnes →
        </Link>
      </section>

      {/* Filtres */}
      <nav className="flex flex-wrap gap-2 text-[13px]">
        <FilterTab href="/prospects" label="Tous" active={!filter} count={stats.total} />
        <FilterTab
          href="/prospects?filter=new"
          label="Nouveaux"
          active={filter === "new"}
          accent
        />
      </nav>

      {/* Pipeline visuel */}
      <section>
        <p className="mb-2 text-[12px] uppercase tracking-wider text-[var(--muted)]">
          Mon pipeline
        </p>
        <div className="surface flex items-center justify-between gap-2 overflow-x-auto p-3 text-[12px]">
          {PROSPECT_STAGES.map((s, i) => (
            <div key={s.key} className="flex flex-1 items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{
                    background: `var(--${s.tone === "neutral" ? "border" : s.tone})`,
                    color: "#fff",
                  }}
                >
                  {i + 1}
                </span>
                <span className="whitespace-nowrap font-medium">{s.label}</span>
              </div>
              {i < PROSPECT_STAGES.length - 1 && (
                <span className="h-px flex-1 bg-[var(--border)]" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Liste des prospects */}
      {leads.length === 0 ? (
        <div className="surface flex flex-col items-center gap-2 px-5 py-14 text-center">
          <p className="text-3xl">📥</p>
          <p className="font-medium">Aucun prospect pour l&apos;instant</p>
          <p className="max-w-xs text-sm text-[var(--text-2)]">
            Les demandes captées via vos campagnes et votre page apparaîtront ici.
          </p>
          <Link href="/campagnes/nouvelle" className="btn btn-primary mt-2">
            Lancer une campagne
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {leads.map((l) => (
            <li key={l.id} className="surface surface-hover p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/prospects/${l.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{l.name ?? "Sans nom"}</span>
                    <Badge tone="violet">{leadSourceLabel(l.source, l.source_url)}</Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-[var(--text-2)]">
                    {l.phone ?? "—"} · il y a {relativeTime(l.created_at)}
                  </p>
                  {l.message && (
                    <p className="mt-1 line-clamp-1 text-[12px] text-[var(--text-2)]">
                      &laquo; {l.message} &raquo;
                    </p>
                  )}
                </Link>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <StatusBadge status={l.status} />
                  <QuickActions phone={l.phone} email={l.email} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterTab({
  href,
  label,
  active,
  count,
  accent,
}: {
  href: string;
  label: string;
  active: boolean;
  count?: number;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="btn btn-ghost py-1.5"
      style={
        active
          ? { borderColor: accent ? "var(--blue)" : "var(--border-strong)" }
          : undefined
      }
    >
      {label}
      {count !== undefined && (
        <span className="ml-1.5 text-[11px] text-[var(--muted)]">{count}</span>
      )}
    </Link>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const labels: Record<LeadStatus, string> = {
    new: "Nouveau",
    contacted: "Contacté",
    converted: "Client",
    archived: "Archivé",
  };
  const tones: Record<LeadStatus, "blue" | "amber" | "green" | "neutral"> = {
    new: "blue",
    contacted: "amber",
    converted: "green",
    archived: "neutral",
  };
  return <Badge tone={tones[status]}>{labels[status]}</Badge>;
}

function QuickActions({ phone, email }: { phone: string | null; email: string | null }) {
  return (
    <div className="flex items-center gap-1">
      {phone && (
        <a
          href={`tel:${phone}`}
          className="btn btn-ghost px-2 py-1.5 text-[13px]"
          aria-label="Appeler"
          title="Appeler"
        >
          📞
        </a>
      )}
      {phone && (
        <a
          href={`sms:${phone}`}
          className="btn btn-ghost px-2 py-1.5 text-[13px]"
          aria-label="SMS"
          title="SMS"
        >
          💬
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="btn btn-ghost px-2 py-1.5 text-[13px]"
          aria-label="E-mail"
          title="E-mail"
        >
          ✉
        </a>
      )}
    </div>
  );
}
