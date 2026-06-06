import { Badge } from "@/components/ui/Badge";
import type { CampaignDraft } from "@/lib/loyalty-agent/engine";

export function CampaignPreview({ drafts }: { drafts: CampaignDraft[] }) {
  if (drafts.length === 0) {
    return (
      <div className="surface p-5 text-sm text-[var(--text-2)]">
        Aucun contact éligible avec une coordonnée compatible pour cette campagne.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {drafts.map((draft) => (
        <li key={draft.dedupeKey} className="surface flex flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{draft.contactName}</span>
            <Badge tone="neutral">{draft.destination}</Badge>
          </div>
          {draft.subject && (
            <p className="text-[12px] font-medium text-[var(--text-2)]">
              {draft.subject}
            </p>
          )}
          <p className="text-[13px] leading-relaxed text-[var(--text-2)]">{draft.body}</p>
        </li>
      ))}
    </ul>
  );
}
