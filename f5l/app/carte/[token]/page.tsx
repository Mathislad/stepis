import { createClient } from "@/lib/supabase/server";

/**
 * Consultation PUBLIQUE d'une carte de fidélité (sans login), via `card_token`.
 * Aucune policy RLS large : on passe par la RPC SECURITY DEFINER
 * `get_loyalty_card_by_token`, qui ne renvoie que les points + les paliers.
 */
export default async function PublicLoyaltyCard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_loyalty_card_by_token", {
    p_token: token,
  });

  const card = data?.[0];

  if (error || !card) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="surface w-full max-w-sm p-7 text-center">
          <p className="text-lg font-semibold">Carte introuvable</p>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            Ce lien de carte de fidélité n&apos;est pas valide.
          </p>
        </div>
      </main>
    );
  }

  const rewards = Array.isArray(card.rewards)
    ? (card.rewards as Array<{ label: string; points_required: number }>)
    : [];

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="surface w-full max-w-sm p-7">
        <p className="text-sm text-[var(--text-2)]">Carte de fidélité</p>
        <div className="my-4 flex items-end gap-2">
          <span className="text-5xl font-bold text-[var(--green)]">{card.points}</span>
          <span className="mb-1.5 text-sm text-[var(--text-2)]">points</span>
        </div>

        {rewards.length > 0 && (
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <p className="mb-2 text-xs font-medium text-[var(--text-2)]">Récompenses</p>
            <ul className="flex flex-col gap-2">
              {rewards.map((r) => {
                const reached = card.points >= r.points_required;
                return (
                  <li key={r.label} className="flex items-center justify-between text-sm">
                    <span className={reached ? "text-[var(--green)]" : ""}>{r.label}</span>
                    <span className="text-[var(--text-2)]">{r.points_required} pts</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
