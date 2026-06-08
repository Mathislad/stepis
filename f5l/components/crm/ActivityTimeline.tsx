import type { ActivityRow } from "@/types/database";
import { ACTIVITY_GLYPHS, ACTIVITY_LABELS } from "@/lib/crm/labels";
import { formatDateTime } from "@/lib/utils";

/** Timeline (journal) d'activité d'un contact. */
export function ActivityTimeline({ activities }: { activities: ActivityRow[] }) {
  if (activities.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-[var(--text-2)]">
        Aucune activité pour l&apos;instant.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {activities.map((a) => (
        <li key={a.id} className="flex gap-3">
          <div
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
            style={{ background: "var(--surface-strong)" }}
            aria-hidden
          >
            {ACTIVITY_GLYPHS[a.type]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{ACTIVITY_LABELS[a.type]}</span>
              <span className="shrink-0 text-[11px] text-[var(--muted)]">
                {formatDateTime(a.created_at)}
              </span>
            </div>
            {a.content && (
              <p className="mt-0.5 text-[13px] whitespace-pre-wrap text-[var(--text-2)]">
                {a.content}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
