import Link from "next/link";
import type { LoyaltyRewardRow } from "@/types/database";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteRewardAction, toggleRewardAction } from "@/lib/loyalty/actions";

export function RewardList({ rewards }: { rewards: LoyaltyRewardRow[] }) {
  if (rewards.length === 0) {
    return (
      <div className="surface p-6 text-center text-sm text-[var(--text-2)]">
        Aucun palier de récompense.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rewards.map((r) => (
        <li key={r.id} className="surface flex items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{r.label}</span>
              <Badge tone={r.active ? "green" : "neutral"}>
                {r.active ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <p className="mt-0.5 text-[13px] tabular-nums text-[var(--text-2)]">
              {r.points_required} points
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <form action={toggleRewardAction}>
              <input type="hidden" name="rewardId" value={r.id} />
              <input type="hidden" name="active" value={(!r.active).toString()} />
              <button type="submit" className="btn btn-ghost px-3 py-1.5 text-[13px]">
                {r.active ? "Désactiver" : "Activer"}
              </button>
            </form>
            <Link
              href={`/loyalty/rewards?edit=${r.id}`}
              className="btn btn-ghost px-3 py-1.5 text-[13px]"
            >
              Éditer
            </Link>
            <form action={deleteRewardAction}>
              <input type="hidden" name="rewardId" value={r.id} />
              <ConfirmButton
                message="Supprimer ce palier ?"
                className="btn btn-ghost px-3 py-1.5 text-[13px]"
                style={{ color: "var(--red)" }}
              >
                Suppr.
              </ConfirmButton>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
