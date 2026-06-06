import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth/require-module";
import { getBlock } from "@/lib/site/content";
import { listOffers } from "@/lib/site/offers";
import { BlockEditorForm } from "@/components/site/BlockEditorForm";
import { BLOCK_TYPE_LABELS } from "@/lib/site/blocks";

export const metadata = { title: "Éditer un bloc" };

export default async function EditBlockPage({
  params,
}: {
  params: Promise<{ blockKey: string }>;
}) {
  const ctx = await requireModule("site");
  const { blockKey } = await params;

  const block = await getBlock(blockKey);
  if (!block) notFound();

  // Le sélecteur d'offre n'est utile que pour un bloc de type "offer".
  const offers = block.block_type === "offer" ? await listOffers() : [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/site" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Mon site
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">
          Bloc « {BLOCK_TYPE_LABELS[block.block_type]} »
        </h1>
      </div>
      <BlockEditorForm block={block} offers={offers} publicSlug={ctx.org.slug} />
    </div>
  );
}
