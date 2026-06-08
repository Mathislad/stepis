import Link from "next/link";
import type { CardListResult } from "@/lib/loyalty/cards";
import type { LoyaltyRewardRow } from "@/types/database";
import { computeProgress } from "@/lib/loyalty/progress";
import { ProgressBar } from "@/components/loyalty/ProgressBar";
import { QuickPoints } from "@/components/loyalty/QuickPoints";
import { SendLinkButton } from "@/components/loyalty/SendLinkButton";

function pageHref(q: string | undefined, page: number): string {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  sp.set("page", String(page));
  return `/loyalty?${sp.toString()}`;
}

export function CardList({
  result,
  rewards,
  query,
}: {
  result: CardListResult;
  rewards: LoyaltyRewardRow[];
  query?: string;
}) {
  if (result.rows.length === 0) {
    return (
      <div className="surface flex flex-col items-center gap-2 px-5 py-14 text-center">
        <p className="text-3xl">💳</p>
        <p className="font-medium">Aucune carte</p>
        <p className="max-w-xs text-sm text-[var(--text-2)]">
          Créez une carte de fidélité pour un de vos contacts.
        </p>
        <Link href="/loyalty/new" className="btn btn-primary mt-2">
          + Nouvelle carte
        </Link>
      </div>
    );
  }

  const { page, pageCount, total } = result;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {result.rows.map((c) => {
          const { next, pct } = computeProgress(c.points, rewards);
          return (
            <li
              key={c.id}
              className="surface flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/loyalty/${c.id}`} className="font-medium hover:underline">
                    {c.contact?.name ?? "Contact supprimé"}
                  </Link>
                  <span className="text-sm tabular-nums text-[var(--text-2)]">
                    · {c.points} pts
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <ProgressBar pct={pct} />
                  <span className="shrink-0 text-[11px] text-[var(--muted)]">
                    {next ? `→ ${next.label} (${next.points_required})` : "Tous paliers atteints"}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <QuickPoints cardId={c.id} />
                <SendLinkButton cardId={c.id} />
                <Link href={`/loyalty/${c.id}`} className="btn btn-ghost px-3 py-1.5 text-[13px]">
                  Détails
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between text-[13px] text-[var(--text-2)]">
        <span>
          {total} carte{total > 1 ? "s" : ""} · page {page}/{pageCount}
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link href={pageHref(query, page - 1)} className="btn btn-ghost px-3 py-1.5">
              ← Précédent
            </Link>
          ) : (
            <span className="btn btn-ghost pointer-events-none px-3 py-1.5 opacity-40">
              ← Précédent
            </span>
          )}
          {page < pageCount ? (
            <Link href={pageHref(query, page + 1)} className="btn btn-ghost px-3 py-1.5">
              Suivant →
            </Link>
          ) : (
            <span className="btn btn-ghost pointer-events-none px-3 py-1.5 opacity-40">
              Suivant →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
