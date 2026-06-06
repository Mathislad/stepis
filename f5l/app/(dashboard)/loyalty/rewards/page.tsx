import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { getReward, listRewards } from "@/lib/loyalty/rewards";
import { RewardForm } from "@/components/loyalty/RewardForm";
import { RewardList } from "@/components/loyalty/RewardList";

export const metadata = { title: "Fidélité — Paliers" };

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireModule("loyalty_card");
  const sp = await searchParams;
  const [rewards, editing] = await Promise.all([
    listRewards(),
    sp.edit ? getReward(sp.edit) : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/loyalty" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Fidélité
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Paliers de récompense</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-[var(--text-2)]">
            {editing ? "Modifier le palier" : "Nouveau palier"}
          </h2>
          <RewardForm key={editing?.id ?? "new"} reward={editing ?? undefined} />
          {editing && (
            <Link
              href="/loyalty/rewards"
              className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]"
            >
              Annuler la modification
            </Link>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-[var(--text-2)]">Vos paliers</h2>
          <RewardList rewards={rewards} />
        </section>
      </div>
    </div>
  );
}
