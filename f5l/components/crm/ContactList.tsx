import Link from "next/link";
import type { ContactListResult } from "@/lib/crm/contacts";
import { Badge } from "@/components/ui/Badge";
import {
  CONTACT_SOURCE_LABELS,
  CONTACT_TYPE_LABELS,
  PIPELINE_LABELS,
  PIPELINE_TONES,
  SOURCE_TONES,
} from "@/lib/crm/labels";
import { formatEuro } from "@/lib/utils";

export interface ContactListParams {
  type?: string;
  status?: string;
  source?: string;
  q?: string;
}

function pageHref(params: ContactListParams, page: number): string {
  const sp = new URLSearchParams();
  if (params.type) sp.set("type", params.type);
  if (params.status) sp.set("status", params.status);
  if (params.source) sp.set("source", params.source);
  if (params.q) sp.set("q", params.q);
  sp.set("page", String(page));
  return `/crm?${sp.toString()}`;
}

export function ContactList({
  result,
  params,
}: {
  result: ContactListResult;
  params: ContactListParams;
}) {
  if (result.rows.length === 0) {
    return (
      <div className="surface flex flex-col items-center gap-2 px-5 py-16 text-center">
        <p className="text-3xl">🗂️</p>
        <p className="font-medium">Aucun contact</p>
        <p className="max-w-xs text-sm text-[var(--text-2)]">
          Ajustez les filtres ou créez votre premier contact.
        </p>
        <Link href="/crm/new" className="btn btn-primary mt-2">
          Nouveau contact
        </Link>
      </div>
    );
  }

  const { page, pageCount, total } = result;

  return (
    <div className="flex flex-col gap-3">
      <ul className="surface divide-y divide-[var(--border)] overflow-hidden p-0">
        {result.rows.map((c) => (
          <li key={c.id}>
            <Link
              href={`/crm/${c.id}`}
              className="surface-hover flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{c.name}</p>
                  <Badge tone={c.type === "b2b" ? "violet" : "neutral"}>
                    {CONTACT_TYPE_LABELS[c.type]}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-[13px] text-[var(--text-2)]">
                  {c.email ?? c.phone ?? "—"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {c.type === "b2b" && c.pipeline_status && (
                  <Badge tone={PIPELINE_TONES[c.pipeline_status]}>
                    {PIPELINE_LABELS[c.pipeline_status]}
                  </Badge>
                )}
                {c.type === "b2b" && c.potential_value != null && (
                  <span className="hidden text-[13px] tabular-nums text-[var(--text-2)] sm:inline">
                    {formatEuro(c.potential_value)}
                  </span>
                )}
                <Badge tone={SOURCE_TONES[c.source]}>{CONTACT_SOURCE_LABELS[c.source]}</Badge>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between text-[13px] text-[var(--text-2)]">
        <span>
          {total} contact{total > 1 ? "s" : ""} · page {page}/{pageCount}
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link href={pageHref(params, page - 1)} className="btn btn-ghost px-3 py-1.5">
              ← Précédent
            </Link>
          ) : (
            <span className="btn btn-ghost pointer-events-none px-3 py-1.5 opacity-40">
              ← Précédent
            </span>
          )}
          {page < pageCount ? (
            <Link href={pageHref(params, page + 1)} className="btn btn-ghost px-3 py-1.5">
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
