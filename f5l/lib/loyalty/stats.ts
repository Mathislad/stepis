import { createClient } from "@/lib/supabase/server";

export interface LoyaltyStats {
  totalCards: number;
  totalPointsDistributed: number; // somme des delta_points (earn)
  totalRedeemed: number; // somme des |delta_points| (redeem)
  activeRewards: number;
}

/**
 * Statistiques fidélité du tenant courant (RLS auto-scope).
 * Les sommes sont calculées en JS (pas d'agrégat PostgREST) — volume faible.
 */
export async function getLoyaltyStats(): Promise<LoyaltyStats> {
  const supabase = await createClient();
  const [cardsRes, rewardsRes, txRes] = await Promise.all([
    supabase.from("loyalty_cards").select("*", { count: "exact", head: true }),
    supabase
      .from("loyalty_rewards")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    supabase.from("loyalty_transactions").select("delta_points, reason"),
  ]);

  let distributed = 0;
  let redeemed = 0;
  for (const t of txRes.data ?? []) {
    if (t.reason === "earn") distributed += t.delta_points;
    else if (t.reason === "redeem") redeemed += Math.abs(t.delta_points);
  }

  return {
    totalCards: cardsRes.count ?? 0,
    totalPointsDistributed: distributed,
    totalRedeemed: redeemed,
    activeRewards: rewardsRes.count ?? 0,
  };
}
