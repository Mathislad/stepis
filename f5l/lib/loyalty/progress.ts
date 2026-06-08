import type { LoyaltyRewardRow } from "@/types/database";

export interface RewardProgress {
  /** Prochain palier non atteint, ou null si tous atteints. */
  next: LoyaltyRewardRow | null;
  /** Progression vers le prochain palier, 0–100. */
  pct: number;
  unlocked: LoyaltyRewardRow[];
  upcoming: LoyaltyRewardRow[];
}

/** Calcule paliers débloqués / à venir + progression. Pur (serveur ou client). */
export function computeProgress(
  points: number,
  rewards: LoyaltyRewardRow[],
): RewardProgress {
  const sorted = [...rewards].sort((a, b) => a.points_required - b.points_required);
  const unlocked = sorted.filter((r) => points >= r.points_required);
  const upcoming = sorted.filter((r) => points < r.points_required);
  const next = upcoming[0] ?? null;
  const pct = next
    ? Math.max(0, Math.min(100, Math.round((points / next.points_required) * 100)))
    : 100;
  return { next, pct, unlocked, upcoming };
}
