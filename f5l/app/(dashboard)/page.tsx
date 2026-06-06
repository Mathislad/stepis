import Link from "next/link";
import { getOrgContext } from "@/lib/auth/context";
import { getTodayData } from "@/lib/dashboard/today";
import { Badge } from "@/components/ui/Badge";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { formatDateTime, formatEuro } from "@/lib/utils";

/**
 * Accueil dashboard — « Today View » à la iOS : résumé visuel de la journée
 * pour les modules activés. Lectures isolées par RLS via lib/dashboard/today.ts
 * (QA-FIX: extrait du fichier de page vers `lib/` pour respecter la convention).
 */
export default async function DashboardHome() {
  const ctx = (await getOrgContext())!;
  const data = await getTodayData(ctx);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "Bonne nuit";
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  })();

  return (
    <div className="flex flex-col gap-7">
      {/* En-tête */}
      <section>
        <h1 className="text-[28px] font-semibold tracking-tight">
          {greeting} {ctx.profile.full_name?.split(" ")[0] ?? ""}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          Voici votre journée chez {ctx.org.name}.
        </p>
      </section>

      {/* UX-FIX: bannière de bienvenue pour les orgs sans données encore */}
      {data.totalContacts === 0 && data.missedCalls === 0 && data.newLeads === 0 && (
        <WelcomeBanner
          firstName={ctx.profile.full_name?.split(" ")[0] ?? ""}
          orgName={ctx.org.name}
          hasSite={ctx.enabledModules.has("site")}
          hasCrm={ctx.enabledModules.has("crm")}
          hasLoyalty={ctx.enabledModules.has("loyalty_card")}
        />
      )}

      {/* Stats clés */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Nouvelles demandes"
          value={data.newLeads}
          href="/crm/leads"
          tone={data.newLeads > 0 ? "blue" : "neutral"}
        />
        <StatCard
          label="Appels manqués"
          value={data.missedCalls}
          href="/telephone?status=missed"
          tone={data.missedCalls > 0 ? "amber" : "neutral"}
        />
        <StatCard label="Mes clients" value={data.totalContacts} href="/crm" />
        <StatCard label="Cartes fidélité" value={data.totalCards} href="/loyalty" />
      </section>

      {/* UX-FIX: « Digest » → « Résumé du jour » (terminologie humaine) */}
      {data.digest && (
        <section className="surface p-5">
          <div className="mb-2 flex items-center gap-2 text-[12px] uppercase tracking-wider text-[var(--muted)]">
            <span aria-hidden>♛</span>
            <span>Résumé du jour — {formatDateTime(data.digest.digest_date)}</span>
          </div>
          <p className="text-sm leading-relaxed">{data.digest.briefing}</p>
          <Link href="/manager" className="mt-3 inline-block text-[13px] text-[var(--blue)]">
            Voir tout →
          </Link>
        </section>
      )}

      {/* Deux colonnes : leads récents + appels récents */}
      {(data.recentLeads.length > 0 || data.recentCalls.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-2">
          {data.recentLeads.length > 0 && (
            <div className="surface p-5">
              <h2 className="mb-3 text-sm font-medium text-[var(--text-2)]">Dernières demandes</h2>
              <ul className="flex flex-col gap-2">
                {data.recentLeads.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">{l.name ?? "Sans nom"}</p>
                      <p className="text-[12px] text-[var(--text-2)]">
                        {l.phone ?? "—"} · {formatDateTime(l.created_at)}
                      </p>
                    </div>
                    {l.status === "new" && <Badge tone="blue">Nouveau</Badge>}
                  </li>
                ))}
              </ul>
              <Link
                href="/crm/leads"
                className="mt-3 inline-block text-[13px] text-[var(--blue)]"
              >
                Voir toutes →
              </Link>
            </div>
          )}
          {data.recentCalls.length > 0 && (
            <div className="surface p-5">
              <h2 className="mb-3 text-sm font-medium text-[var(--text-2)]">Derniers appels</h2>
              <ul className="flex flex-col gap-2">
                {data.recentCalls.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">{c.caller_name ?? c.caller_phone ?? "Inconnu"}</p>
                      <p className="text-[12px] text-[var(--text-2)]">
                        {formatDateTime(c.created_at)}
                      </p>
                    </div>
                    <Badge
                      tone={
                        c.status === "answered"
                          ? "green"
                          : c.status === "missed"
                            ? "amber"
                            : "neutral"
                      }
                    >
                      {c.status === "missed"
                        ? "Manqué"
                        : c.status === "answered"
                          ? "Répondu"
                          : "Vocal"}
                    </Badge>
                  </li>
                ))}
              </ul>
              <Link href="/telephone" className="mt-3 inline-block text-[13px] text-[var(--blue)]">
                Voir tous →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Factures en retard (alerte) */}
      {data.overdueInvoices.length > 0 && (
        <section className="surface p-5" style={{ borderColor: "rgba(255,69,58,0.35)" }}>
          <div
            className="mb-2 flex items-center gap-2 text-[12px] uppercase tracking-wider"
            style={{ color: "var(--red)" }}
          >
            <span aria-hidden>⚠</span>
            <span>
              {data.overdueCount} facture{data.overdueCount > 1 ? "s" : ""} en retard
            </span>
          </div>
          <ul className="flex flex-col gap-1.5 text-sm">
            {data.overdueInvoices.map((d) => (
              <li key={d.id} className="flex items-center justify-between">
                <Link href={`/admin/${d.id}`} className="truncate hover:underline">
                  {d.title}
                </Link>
                <span className="tabular-nums text-[var(--text-2)]">
                  {d.amount != null ? formatEuro(Number(d.amount)) : "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  tone = "neutral",
}: {
  label: string;
  value: number;
  href?: string;
  tone?: "neutral" | "blue" | "amber";
}) {
  const color =
    tone === "blue" ? "var(--blue)" : tone === "amber" ? "var(--amber)" : "var(--text)";
  const inner = (
    <div className="surface p-4">
      <p className="text-[26px] font-semibold tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="mt-0.5 text-[12px] text-[var(--text-2)]">{label}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-transform active:scale-[0.98]">
      {inner}
    </Link>
  ) : (
    inner
  );
}
