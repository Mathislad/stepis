import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { listCards } from "@/lib/loyalty/cards";
import { listRewards } from "@/lib/loyalty/rewards";
import { getLoyaltyStats } from "@/lib/loyalty/stats";
import { CardList } from "@/components/loyalty/CardList";
import { Input } from "@/components/ui/Input";

export const metadata = { title: "Fidélité" };

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[12px] text-[var(--text-2)]">{label}</p>
    </div>
  );
}

export default async function LoyaltyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireModule("loyalty_card");
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;

  const [stats, rewards, result] = await Promise.all([
    getLoyaltyStats(),
    listRewards(),
    listCards({ search: q, page }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Fidélité</h1>
          <p className="text-sm text-[var(--text-2)]">Cartes & récompenses</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/loyalty/rewards" className="btn btn-ghost">
            Paliers
          </Link>
          <Link href="/loyalty/new" className="btn btn-primary">
            + Nouvelle carte
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Cartes" value={stats.totalCards} />
        <Stat label="Points distribués" value={stats.totalPointsDistributed} />
        <Stat label="Points échangés" value={stats.totalRedeemed} />
        <Stat label="Paliers actifs" value={stats.activeRewards} />
      </div>

      {/* Recherche : formulaire GET natif (pas de JS nécessaire). */}
      <form action="/loyalty" className="flex items-center gap-2">
        <Input
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Rechercher (nom, e-mail, téléphone)…"
          className="flex-1 py-2"
          style={{ width: "auto", minWidth: "200px" }}
        />
        <button type="submit" className="btn btn-ghost py-2">
          Rechercher
        </button>
      </form>

      <CardList result={result} rewards={rewards} query={q} />
    </div>
  );
}
