import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { getSiteContent } from "@/lib/site/content";
import { listOffers } from "@/lib/site/offers";
import { BlockList } from "@/components/site/BlockList";
import { AddBlockMenu } from "@/components/site/AddBlockMenu";

export const metadata = { title: "Mon site" };

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="surface p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[12px] text-[var(--text-2)]">{label}</p>
    </div>
  );
}

export default async function SitePage() {
  const ctx = await requireModule("site");
  const [blocks, offers] = await Promise.all([getSiteContent(), listOffers()]);

  const published = blocks.filter((b) => b.published).length;
  const activeOffers = offers.filter((o) => o.active).length;
  const publicUrl = `/p/${ctx.org.slug}`;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mon site</h1>
          <p className="text-sm text-[var(--text-2)]">{ctx.org.name}</p>
        </div>
        {/* UX-FIX: bouton « Voir mon site en vrai » plus visible (variant primary) */}
        <a href={publicUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
          Voir mon site en vrai ↗
        </a>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Sections visibles" value={`${published}/${blocks.length}`} />
        <Stat label="Offres actives" value={activeOffers} />
        <Link
          href="/site/offers"
          className="surface surface-hover flex items-center justify-center p-4 text-center text-sm font-medium"
        >
          Gérer les offres →
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* UX-FIX: « Blocs » → « Sections de votre site » (plus humain) */}
          <h2 className="text-sm font-medium text-[var(--text-2)]">Sections de votre site</h2>
          <AddBlockMenu />
        </div>
        <BlockList blocks={blocks} />
      </section>
    </div>
  );
}
