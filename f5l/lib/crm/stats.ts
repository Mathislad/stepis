import { createClient } from "@/lib/supabase/server";

export interface CrmStats {
  total: number;
  b2b: number;
  b2c: number;
  /** Contacts dont `source = 'f5l_acquisition'` — compteur ROI « amenés par F5L ». */
  f5lAcquired: number;
}

/**
 * Statistiques CRM du tenant courant. 4 comptages `head` en parallèle
 * (aucune ligne rapatriée, pas de N+1). RLS auto-scope par org.
 */
export async function getCrmStats(): Promise<CrmStats> {
  const supabase = await createClient();
  const base = () => supabase.from("contacts").select("*", { count: "exact", head: true });

  const [all, b2b, b2c, f5l] = await Promise.all([
    base(),
    base().eq("type", "b2b"),
    base().eq("type", "b2c"),
    base().eq("source", "f5l_acquisition"),
  ]);

  return {
    total: all.count ?? 0,
    b2b: b2b.count ?? 0,
    b2c: b2c.count ?? 0,
    f5lAcquired: f5l.count ?? 0,
  };
}
