import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth/require-module";
import { getCard, listCardTransactions } from "@/lib/loyalty/cards";
import { listRewards } from "@/lib/loyalty/rewards";
import { generateQrDataUrl, getCardUrl } from "@/lib/loyalty/qr";
import { computeProgress } from "@/lib/loyalty/progress";
import { ProgressBar } from "@/components/loyalty/ProgressBar";
import { PointsForm } from "@/components/loyalty/PointsForm";
import { SendLinkButton } from "@/components/loyalty/SendLinkButton";
import { QrDisplay } from "@/components/loyalty/QrDisplay";
import { formatDateTime } from "@/lib/utils";
import type { LoyaltyReason } from "@/types/database";

export const metadata = { title: "Fidélité — Carte" };

const REASON_LABELS: Record<LoyaltyReason, string> = {
  earn: "Gain",
  redeem: "Rachat",
  adjust: "Ajustement",
};

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  await requireModule("loyalty_card");
  const { cardId } = await params;

  const card = await getCard(cardId);
  if (!card) notFound();

  const [rewards, transactions, qrDataUrl] = await Promise.all([
    listRewards(),
    listCardTransactions(cardId),
    generateQrDataUrl(card.card_token),
  ]);

  const activeRewards = rewards.filter((r) => r.active);
  const { next, pct } = computeProgress(card.points, activeRewards);
  const url = getCardUrl(card.card_token);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/loyalty" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Fidélité
        </Link>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{card.contact?.name ?? "Contact"}</h1>
            <p className="text-sm text-[var(--text-2)]">
              {card.contact?.email ?? card.contact?.phone ?? "Aucune coordonnée"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--green)" }}>
              {card.points}
            </p>
            <p className="text-xs text-[var(--muted)]">points</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-[var(--text-2)]">Gérer les points</h2>
          <PointsForm cardId={card.id} />
          <div className="mt-1 flex items-center gap-3">
            <ProgressBar pct={pct} />
            <span className="shrink-0 text-[12px] text-[var(--muted)]">
              {next ? `→ ${next.label} (${next.points_required})` : "Max atteint"}
            </span>
          </div>

          <h2 className="mt-2 text-sm font-medium text-[var(--text-2)]">Historique</h2>
          <div className="surface overflow-hidden p-0">
            {transactions.length === 0 ? (
              <p className="p-4 text-center text-sm text-[var(--text-2)]">Aucune transaction.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[12px] text-[var(--muted)]">
                    <th className="p-2.5 font-medium">Date</th>
                    <th className="p-2.5 font-medium">Type</th>
                    <th className="p-2.5 text-right font-medium">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-t border-[var(--border)]">
                      <td className="p-2.5 text-[var(--text-2)]">{formatDateTime(t.created_at)}</td>
                      <td className="p-2.5">{REASON_LABELS[t.reason]}</td>
                      <td
                        className="p-2.5 text-right tabular-nums"
                        style={{ color: t.delta_points >= 0 ? "var(--green)" : "var(--red)" }}
                      >
                        {t.delta_points > 0 ? `+${t.delta_points}` : t.delta_points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-[var(--text-2)]">Carte publique</h2>
          <QrDisplay qrDataUrl={qrDataUrl} url={url} />
          <SendLinkButton cardId={card.id} className="btn btn-primary" />

          <h2 className="mt-2 text-sm font-medium text-[var(--text-2)]">Paliers</h2>
          <div className="surface flex flex-col gap-1.5 p-4">
            {activeRewards.length === 0 ? (
              <p className="text-sm text-[var(--text-2)]">
                Aucun palier actif.{" "}
                <Link href="/loyalty/rewards" className="underline">
                  En créer un
                </Link>
              </p>
            ) : (
              activeRewards.map((r) => {
                const reached = card.points >= r.points_required;
                return (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span style={reached ? { color: "var(--green)" } : undefined}>{r.label}</span>
                    <span className="text-[var(--text-2)]">
                      {reached ? "Débloqué ✓" : `${r.points_required} pts`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
