import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCard } from "@/lib/loyalty/cards";
import { computeProgress } from "@/lib/loyalty/progress";
import { ProgressBar } from "@/components/loyalty/ProgressBar";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const data = await getPublicCard(token);
  const title = data ? `Ma carte de fidélité — ${data.org.name}` : "Carte introuvable";
  return {
    title,
    robots: { index: false, follow: false },
    openGraph: { title },
  };
}

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getPublicCard(token);
  if (!data) notFound();

  const { card, org, rewards, transactions } = data;
  const { next, pct, unlocked, upcoming } = computeProgress(card.points, rewards);
  const recent = transactions.slice(0, 5);

  return (
    <main className="mx-auto max-w-md px-5 py-12">
      {/* Carte */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
        <p className="text-sm font-semibold text-zinc-900">{org.name}</p>
        <p className="mt-0.5 text-xs font-medium tracking-wide text-zinc-400 uppercase">
          Carte de fidélité
        </p>
        <div className="mt-6 flex items-end gap-2">
          <span className="text-6xl font-bold tracking-tight text-zinc-900 tabular-nums">
            {card.points}
          </span>
          <span className="mb-2 text-zinc-500">points</span>
        </div>
        {next ? (
          <div className="mt-6">
            <div className="mb-1.5 flex justify-between text-xs text-zinc-500">
              <span>Prochain : {next.label}</span>
              <span className="tabular-nums">
                {card.points}/{next.points_required}
              </span>
            </div>
            <ProgressBar pct={pct} track="#e4e4e7" fill="#16a34a" />
          </div>
        ) : (
          <p className="mt-6 text-sm font-medium text-emerald-600">
            Tous les paliers sont débloqués 🎉
          </p>
        )}
      </div>

      {unlocked.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">Récompenses débloquées</h2>
          <ul className="flex flex-col gap-2">
            {unlocked.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5"
              >
                <span className="font-medium text-zinc-800">{r.label}</span>
                <span className="text-sm font-semibold text-emerald-600">Débloqué ✓</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">À venir</h2>
          <ul className="flex flex-col gap-2">
            {upcoming.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5"
              >
                <span className="text-zinc-700">{r.label}</span>
                <span className="text-sm text-zinc-500 tabular-nums">{r.points_required} pts</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">Activité récente</h2>
          <ul className="flex flex-col divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-zinc-500">{formatDate(t.created_at)}</span>
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: t.delta_points >= 0 ? "#16a34a" : "#dc2626" }}
                >
                  {t.delta_points > 0 ? `+${t.delta_points}` : t.delta_points}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-10 text-center text-xs text-zinc-400">
        Propulsé par <span className="font-semibold text-zinc-600">F5L</span>
      </footer>
    </main>
  );
}
