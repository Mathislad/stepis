import { createClient } from "@/lib/supabase/server";
import type { OrgContext } from "@/lib/auth/context";

export interface RecentLead {
  id: string;
  name: string | null;
  phone: string | null;
  status: string;
  created_at: string;
}

export interface RecentCall {
  id: string;
  caller_name: string | null;
  caller_phone: string | null;
  status: string;
  created_at: string;
}

export interface OverdueInvoice {
  id: string;
  title: string;
  amount: number | null;
  due_date: string | null;
}

export interface TodayData {
  newLeads: number;
  recentLeads: RecentLead[];
  totalContacts: number;
  missedCalls: number;
  recentCalls: RecentCall[];
  digest: { digest_date: string; briefing: string } | null;
  overdueInvoices: OverdueInvoice[];
  overdueCount: number;
  totalCards: number;
}

/**
 * Données du Today View — agrégat parallèle des stats clés pour l'accueil
 * dashboard. Tout passe par le client serveur (RLS auto-scope). Les widgets
 * dont le module n'est pas activé renvoient des zéros / listes vides.
 *
 * Conformité convention `lib/` : aucun appel Supabase dans la page.
 */
export async function getTodayData(ctx: OrgContext): Promise<TodayData> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    leadsRes,
    recentLeadsRes,
    contactsRes,
    callsRes,
    recentCallsRes,
    digestRes,
    overdueRes,
    cardsRes,
  ] = await Promise.all([
    ctx.enabledModules.has("lead_capture") || ctx.enabledModules.has("crm")
      ? supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "new")
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
      ? supabase.from("calls").select("*", { count: "exact", head: true }).eq("status", "missed")
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
          .lt("due_date", today)
          .order("due_date", { ascending: true })
          .limit(3)
      : Promise.resolve({ data: [], count: 0 }),
    ctx.enabledModules.has("loyalty_card")
      ? supabase.from("loyalty_cards").select("*", { count: "exact", head: true })
      : Promise.resolve({ count: 0 }),
  ]);

  const digestRow = (digestRes.data ?? [])[0] as
    | { digest_date: string; summary: { briefing?: string } | null }
    | undefined;
  const briefing =
    digestRow?.summary && typeof digestRow.summary === "object" && "briefing" in digestRow.summary
      ? (digestRow.summary.briefing as string | undefined)
      : undefined;

  return {
    newLeads: leadsRes.count ?? 0,
    recentLeads: (recentLeadsRes.data ?? []) as RecentLead[],
    totalContacts: contactsRes.count ?? 0,
    missedCalls: callsRes.count ?? 0,
    recentCalls: (recentCallsRes.data ?? []) as RecentCall[],
    digest: digestRow && briefing ? { digest_date: digestRow.digest_date, briefing } : null,
    overdueInvoices: (overdueRes.data ?? []) as OverdueInvoice[],
    overdueCount: overdueRes.count ?? 0,
    totalCards: cardsRes.count ?? 0,
  };
}
