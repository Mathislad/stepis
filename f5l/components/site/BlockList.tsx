import Link from "next/link";
import type { SiteContentRow } from "@/types/database";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { BLOCK_TYPE_GLYPHS, BLOCK_TYPE_LABELS, blockPreview } from "@/lib/site/blocks";
import {
  deleteBlockAction,
  moveBlockAction,
  togglePublishedAction,
} from "@/lib/site/actions";

export function BlockList({ blocks }: { blocks: SiteContentRow[] }) {
  if (blocks.length === 0) {
    return (
      <div className="surface flex flex-col items-center gap-2 px-5 py-12 text-center">
        <p className="text-3xl">🧱</p>
        <p className="font-medium">Aucun bloc</p>
        <p className="max-w-xs text-sm text-[var(--text-2)]">
          Ajoutez un premier bloc de contenu pour composer votre site.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {blocks.map((b, i) => (
        <li key={b.id} className="surface flex items-center justify-between gap-3 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-lg" aria-hidden>
              {BLOCK_TYPE_GLYPHS[b.block_type]}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{BLOCK_TYPE_LABELS[b.block_type]}</span>
                <Badge tone={b.published ? "green" : "neutral"}>
                  {b.published ? "Publié" : "Brouillon"}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-[13px] text-[var(--text-2)]">
                {blockPreview(b)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <form action={moveBlockAction}>
              <input type="hidden" name="blockId" value={b.id} />
              <input type="hidden" name="direction" value="up" />
              <button
                type="submit"
                disabled={i === 0}
                aria-label="Monter"
                className="btn btn-ghost px-2 py-1.5 text-[13px] disabled:opacity-30"
              >
                ↑
              </button>
            </form>
            <form action={moveBlockAction}>
              <input type="hidden" name="blockId" value={b.id} />
              <input type="hidden" name="direction" value="down" />
              <button
                type="submit"
                disabled={i === blocks.length - 1}
                aria-label="Descendre"
                className="btn btn-ghost px-2 py-1.5 text-[13px] disabled:opacity-30"
              >
                ↓
              </button>
            </form>
            <form action={togglePublishedAction}>
              <input type="hidden" name="blockId" value={b.id} />
              <input type="hidden" name="published" value={(!b.published).toString()} />
              <button type="submit" className="btn btn-ghost px-3 py-1.5 text-[13px]">
                {b.published ? "Dépublier" : "Publier"}
              </button>
            </form>
            <Link
              href={`/site/edit/${b.block_key}`}
              className="btn btn-ghost px-3 py-1.5 text-[13px]"
            >
              Éditer
            </Link>
            <form action={deleteBlockAction}>
              <input type="hidden" name="blockId" value={b.id} />
              <ConfirmButton
                message="Supprimer ce bloc ?"
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
