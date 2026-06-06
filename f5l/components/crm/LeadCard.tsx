import type { LeadRow } from "@/types/database";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import {
  CONTACT_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_TONES,
  SOURCE_TONES,
} from "@/lib/crm/labels";
import { convertLeadAction, updateLeadStatusAction } from "@/lib/crm/actions";
import { formatDate } from "@/lib/utils";

/** Carte d'un lead entrant + actions (statut, conversion) en formulaires natifs. */
export function LeadCard({ lead }: { lead: LeadRow }) {
  const converted = lead.status === "converted";

  return (
    <div className="surface flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{lead.name ?? "Lead sans nom"}</p>
            <Badge tone={LEAD_STATUS_TONES[lead.status]}>
              {LEAD_STATUS_LABELS[lead.status]}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-[13px] text-[var(--text-2)]">
            {lead.email ?? "—"}
            {lead.phone ? ` · ${lead.phone}` : ""}
          </p>
        </div>
        <Badge tone={SOURCE_TONES[lead.source]}>{CONTACT_SOURCE_LABELS[lead.source]}</Badge>
      </div>

      {lead.message && (
        <p className="rounded-lg bg-[var(--surface)] px-3 py-2 text-[13px] whitespace-pre-wrap text-[var(--text-2)]">
          {lead.message}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-[var(--muted)]">
          Reçu le {formatDate(lead.created_at)}
        </span>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* Changement de statut */}
          <form action={updateLeadStatusAction} className="flex items-center gap-1.5">
            <input type="hidden" name="leadId" value={lead.id} />
            <Select
              name="status"
              defaultValue={lead.status}
              aria-label="Statut du lead"
              className="px-2.5 py-1.5 text-[13px]"
            >
              {(Object.keys(LEAD_STATUS_LABELS) as Array<keyof typeof LEAD_STATUS_LABELS>).map(
                (s) => (
                  <option key={s} value={s}>
                    {LEAD_STATUS_LABELS[s]}
                  </option>
                ),
              )}
            </Select>
            <button type="submit" className="btn btn-ghost px-3 py-1.5 text-[13px]">
              OK
            </button>
          </form>

          {/* Conversion en contact */}
          {!converted && (
            <form action={convertLeadAction} className="flex items-center gap-1.5">
              <input type="hidden" name="leadId" value={lead.id} />
              <Select
                name="type"
                defaultValue="b2c"
                aria-label="Type de contact"
                className="px-2.5 py-1.5 text-[13px]"
              >
                <option value="b2c">Particulier</option>
                <option value="b2b">Professionnel</option>
              </Select>
              <button type="submit" className="btn btn-primary px-3 py-1.5 text-[13px]">
                Convertir
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
