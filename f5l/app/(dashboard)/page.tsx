import Link from "next/link";
import { getOrgContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, formatEuro } from "@/lib/utils";

/**
 * Tableau de bord « Today View » à la iOS : un résumé visuel de la journée
 * couvrant les modules activés (CRM, leads, appels, fidélité, manager).
 * Lectures isolées par la RLS (toujours via lib/supabase/server.ts).
 *
 * DECISION: tout est lu en parallèle et chaque widget est défensif :
 * un module non activé / sans données affiche un état vide.
 */
export default async function DashboardHome() {
  const ctx = (await getOrgContext())!;
  const supabase = await createClient();

  // ── Récup parallèles, scopées par RLS ─────────────────────────────────────
  const [leadsRes, recentLeadsRes, contactsRes, callsRes, recentCallsRes, todayDigestRes, overdueRes, cardsRes] =
    await Promise.all([
      ctx.enabledModules.has("lead_capture") || ctx.enabledModules.has("crm")
        ? supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("status", "new")
        : Promise.resolve({ count: 0 }),
      ctx.enabledModules.has("crm")
        ? supabase
            .from("leads")
            .select("id, name, phone, status, created_at")
            .order("created_at", { ascending: false })
            .limit(3)
        : Promise.resolve({ data: [] }),
      ctx.enabledModules.has("crm")
        ? supabase.from("contacts").select("*", { count: "exact", head: true })
        : Promise.resolve({ count: 0 }),
      ctx.enabledModules.has("phone")
        ? supabase
            .from("calls")
            .select("*", { count: "exact", head: true })
            .eq("status", "missed")
        : Promise.resolve({ count: 0 }),
      ctx.enabledModules.has("phone")
        ? supabase
            .from("calls")
            .select("id, caller_name, caller_phone, status, created_at")
            .order("created_at", { ascending: false })
            .limit(3)
        : Promise.resolve({ data: [] }),
      ctx.enabledModules.has("manager")
        ? supabase
            .from("daily_digest")
            .select("digest_date, summary")
            .order("digest_date", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [] }),
      ctx.enabledModules.has("admin")
        ? supabase
            .from("documents")
            .select("id, title, amount, due_date", { count: "exact" })
            .eq("doc_type", "facture")
            .neq("status", "paid")
            .neq("status", "cancelled")
            .lt("due_date", new Date().toISOString().slice(0, 10))
            .order("due_date", { ascending: true })
            .limit(3)
        : Promise.resolve({ data: [], count: 0 }),
      ctx.enabledModules.has("loyalty_card")
        ? supabase.from("loyalty_cards").select("*", { count: "exact", head: true })
        : Promise.resolve({ count: 0 }),
    ]);

  const newLeads = leadsRes.count ?? 0;
  const recentLeads = (recentLeadsRes.data ?? []) as Array<{
    id: string;
    name: string | null;
    phone: string | null;
    status: string;
    created_at: string;
  }>;
  const totalContacts = contactsRes.count ?? 0;
  const missedCalls = callsRes.count ?? 0;
  const recentCalls = (recentCallsRes.data ?? []) as Array<{
    id: string;
    caller_name: string | null;
    caller_phone: string | null;
    status: string;
    created_at: string;
  }>;
  const digest = (todayDigestRes.data ?? [])[0] as
    | { digest_date: string; summary: { briefing?: string } | null }
    | undefined;
  const overdueInvoices = (overdueRes.data ?? []) as Array<{
    id: string;
    title: string;
    amount: number | null;
    due_date: string | null;
  }>;
  const overdueCount = overdueRes.count ?? 0;
  const totalCards = cardsRes.count ?? 0;

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

      {/* Stats clés */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Nouvelles demandes" value={newLeads} href="/crm/leads" tone={newLeads > 0 ? "blue" : "neutral"} />
        <StatCard label="Appels manqués" value={missedCalls} href="/telephone?status=missed" tone={missedCalls > 0 ? "amber" : "neutral"} />
        <StatCard label="Mes clients" value={totalContacts} href="/crm" />
        <StatCard label="Cartes fidélité" value={totalCards} href="/loyalty" />
      </section>

      {/* Manager digest (si présent) */}
      {digest?.summary?.briefing && (
        <section className="surface p-5">
          <div className="mb-2 flex items-center gap-2 text-[12px] uppercase tracking-wider text-[var(--muted)]">
            <span>♛</span>
            <span>Résumé du jour — {formatDateTime(digest.digest_date)}</span>
          </div>
          <p className="text-sm leading-relaxed">{digest.summary.briefing}</p>
          <Link href="/manager" className="mt-3 inline-block text-[13px] text-[var(--blue)]">
            Voir tout →
          </Link>
        </section>
      )}

      {/* Deux colonnes : leads récents + appels récents */}
      {(recentLeads.length > 0 || recentCalls.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-2">
          {recentLeads.length > 0 && (
            <div className="surface p-5">
              <h2 className="mb-3 text-sm font-medium text-[var(--text-2)]">Dernières demandes</h2>
              <ul className="flex flex-col gap-2">
                {recentLeads.map((l) => (
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
              <Link href="/crm/leads" className="mt-3 inline-block text-[13px] text-[var(--blue)]">
                Voir toutes →
              </Link>
            </div>
          )}
          {recentCalls.length > 0 && (
            <div className="surface p-5">
              <h2 className="mb-3 text-sm font-medium text-[var(--text-2)]">Derniers appels</h2>
              <ul className="flex flex-col gap-2">
                {recentCalls.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">{c.caller_name ?? c.caller_phone ?? "Inconnu"}</p>
                      <p className="text-[12px] text-[var(--text-2)]">
                        {formatDateTime(c.created_at)}
                      </p>
                    </div>
                    <Badge tone={c.status === "answered" ? "green" : c.status === "missed" ? "amber" : "neutral"}>
                      {c.status === "missed" ? "Manqué" : c.status === "answered" ? "Répondu" : "Vocal"}
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
      {overdueInvoices.length > 0 && (
        <section className="surface p-5" style={{ borderColor: "rgba(255,69,58,0.35)" }}>
          <div className="mb-2 flex items-center gap-2 text-[12px] uppercase tracking-wider" style={{ color: "var(--red)" }}>
            <span>⚠</span>
            <span>{overdueCount} facture{overdueCount > 1 ? "s" : ""} en retard</span>
          </div>
          <ul className="flex flex-col gap-1.5 text-sm">
            {overdueInvoices.map((d) => (
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
