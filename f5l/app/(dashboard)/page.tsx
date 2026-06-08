import Link from "next/link";
import { getOrgContext } from "@/lib/auth/context";
import {
  getAcquisitionMetrics,
  leadSourceLabel,
} from "@/lib/dashboard/acquisition-metrics";
import { Badge } from "@/components/ui/Badge";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { formatEuro } from "@/lib/utils";

export const metadata = { title: "Tableau de bord — F5L Acquisition" };

const STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  converted: "Client",
  archived: "Archivé",
};
const STATUS_TONES: Record<string, "blue" | "green" | "neutral" | "amber"> = {
  new: "blue",
  contacted: "amber",
  converted: "green",
  archived: "neutral",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

function evolution(now: number, prev: number): { value: number; pct: number } {
  const value = now - prev;
  const pct = prev > 0 ? Math.round((value / prev) * 100) : value > 0 ? 100 : 0;
  return { value, pct };
}

export default async function DashboardHome() {
  const ctx = (await getOrgContext())!;
  const m = await getAcquisitionMetrics();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "Bonne nuit";
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  })();

  const evo = evolution(m.prospectsThisMonth, m.prospectsPrevMonth);
  const onboardingComplete = m.activeCampaigns > 0 && m.prospectsThisMonth > 0;

  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="text-[28px] font-semibold tracking-tight">
          {greeting} {ctx.profile.full_name?.split(" ")[0] ?? ""}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          {onboardingComplete
            ? "Votre système d'acquisition tourne. Voici les chiffres du mois."
            : "Votre système d'acquisition est presque prêt — finalisez les 3 étapes ci-dessous."}
        </p>
      </header>

      {!onboardingComplete && <OnboardingChecklist activeCampaigns={m.activeCampaigns} prospectsThisMonth={m.prospectsThisMonth} />}

      {/* Les 4 métriques clés — réponse à « est-ce rentable ? » */}
      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Prospects ce mois"
            value={m.prospectsThisMonth}
            hint={
              evo.pct === 0
                ? "Aucune comparaison"
                : `${evo.pct > 0 ? "+" : ""}${evo.pct}% vs mois dernier`
            }
            tone={evo.pct > 0 ? "green" : evo.pct < 0 ? "red" : "neutral"}
          />
          <MetricCard
            label="Coût par prospect"
            value={m.cpl != null ? formatEuro(m.cpl) : "—"}
            hint={
              m.cpl != null
                ? m.cpl <= 10
                  ? "Excellent (< 10 €)"
                  : m.cpl <= 20
                    ? "Correct"
                    : "À optimiser"
                : "Pas encore de données"
            }
            tone={m.cpl == null ? "neutral" : m.cpl <= 10 ? "green" : m.cpl <= 20 ? "amber" : "red"}
          />
          <MetricCard label="Campagnes actives" value={m.activeCampaigns} />
          <MetricCard
            label="Taux de conversion"
            value={`${m.conversionRatePct}%`}
            hint={
              m.conversionRatePct >= 30
                ? "Très bon"
                : m.conversionRatePct >= 15
                  ? "Bon"
                  : "À améliorer"
            }
            tone={
              m.conversionRatePct >= 30
                ? "green"
                : m.conversionRatePct >= 15
                  ? "amber"
                  : "neutral"
            }
          />
        </div>
      </section>

      {/* Derniers prospects */}
      <section className="surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-[var(--text-2)]">Derniers prospects</h2>
          <Link href="/prospects" className="text-[13px] text-[var(--blue)]">
            Voir tous →
          </Link>
        </div>
        {m.recentProspects.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--text-2)]">
            Aucun prospect pour l&apos;instant. Lancez votre première campagne ou diffusez votre page.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--border-subtle)]">
            {m.recentProspects.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <Link href={`/prospects/${p.id}`} className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{p.name ?? "Sans nom"}</span>
                  <span className="text-[12px] text-[var(--text-2)]">
                    {p.phone ?? "—"} · {leadSourceLabel(p.source, p.source_url)} ·{" "}
                    {relativeTime(p.created_at)}
                  </span>
                </Link>
                <Badge tone={STATUS_TONES[p.status] ?? "neutral"}>
                  {STATUS_LABELS[p.status] ?? p.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Performance des campagnes */}
      {m.campaignTiles.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--text-2)]">Performance des campagnes</h2>
            <Link href="/campagnes" className="text-[13px] text-[var(--blue)]">
              Gérer →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {m.campaignTiles.map((c) => (
              <Link key={c.id} href={`/campagnes/${c.id}`} className="surface surface-hover block p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{c.title}</span>
                  <Badge tone={c.status === "active" ? "green" : "amber"}>
                    {c.status === "active" ? "Active" : "En pause"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[12px] capitalize text-[var(--text-2)]">{c.platform}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                  <Stat label="Leads" value={c.leadsCount} />
                  <Stat label="Dépensé" value={formatEuro(c.spend)} />
                  <Stat label="CPL" value={c.cpl != null ? formatEuro(c.cpl) : "—"} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Automatisations actives (informatif) */}
      <section className="surface p-5">
        <h2 className="mb-3 text-sm font-medium text-[var(--text-2)]">Automatisations actives</h2>
        <ul className="flex flex-col gap-2 text-[13px]">
          <li className="flex items-center gap-2">
            <span style={{ color: "var(--green)" }}>✓</span>
            Réponse SMS au prospect dans les 2 minutes
          </li>
          <li className="flex items-center gap-2">
            <span style={{ color: "var(--green)" }}>✓</span>
            E-mail de confirmation au prospect
          </li>
          <li className="flex items-center gap-2">
            <span style={{ color: "var(--green)" }}>✓</span>
            Notification SMS à vous à chaque nouveau prospect
          </li>
          <li className="flex items-center gap-2 text-[var(--muted)]">
            <span>○</span>
            Relance 48 h sans réponse — désactivée
          </li>
        </ul>
        <Link href="/settings/automation" className="mt-3 inline-block text-[13px] text-[var(--blue)]">
          Configurer →
        </Link>
      </section>

      {/* Teaser "Bientôt" */}
      <section className="surface p-5" style={{ background: "rgba(191,90,242,0.04)" }}>
        <p className="text-[12px] uppercase tracking-wider text-[var(--violet)]">À venir</p>
        <h2 className="mt-1 text-base font-semibold">L&apos;équipe d&apos;employés IA s&apos;agrandit</h2>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          Fidélisation, Téléphone IA, Réputation, Manager IA… Nous construisons la suite. Vous serez
          prévenu(e) au lancement de chaque module.
        </p>
        <Link href="/bientot/loyalty-agent" className="mt-3 inline-block text-[13px] text-[var(--violet)]">
          Découvrir →
        </Link>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "green" | "red" | "amber" | "blue";
}) {
  const color =
    tone === "green"
      ? "var(--green)"
      : tone === "red"
        ? "var(--red)"
        : tone === "amber"
          ? "var(--amber)"
          : tone === "blue"
            ? "var(--blue)"
            : "var(--text)";
  return (
    <div className="surface p-4">
      <p className="text-[26px] font-semibold tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="mt-0.5 text-[12px] text-[var(--text-2)]">{label}</p>
      {hint && (
        <p className="mt-1 text-[11px]" style={{ color: tone === "neutral" ? "var(--muted)" : color }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
    </div>
  );
}
