import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth/require-module";
import { getDocumentWithReminders } from "@/lib/admin/documents";
import {
  deleteDocumentAction,
  markPaidAction,
  markSentAction,
  updateDocumentStatusAction,
} from "@/lib/admin/actions";
import { DOC_TYPE_LABELS, STATUS_LABELS, STATUS_TONES } from "@/lib/admin/labels";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ReminderControls } from "@/components/admin/ReminderControls";
import { SignatureControl } from "@/components/admin/SignatureControl";
import { formatDate, formatDateTime, formatEuro } from "@/lib/utils";

export const metadata = { title: "Documents — Détail" };

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  await requireModule("admin");
  const { documentId } = await params;
  const result = await getDocumentWithReminders(documentId);
  if (!result) notFound();
  const { doc, reminders } = result;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Mes documents
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase text-[var(--muted)]">{DOC_TYPE_LABELS[doc.doc_type]}</p>
            <h1 className="text-2xl font-semibold">{doc.title}</h1>
          </div>
          <Badge tone={STATUS_TONES[doc.status]}>{STATUS_LABELS[doc.status]}</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface p-4">
          <p className="mb-1 text-[12px] text-[var(--text-2)]">Destinataire</p>
          <p className="font-medium">{doc.recipient_name ?? "—"}</p>
          <p className="text-sm text-[var(--text-2)]">{doc.recipient_email ?? "—"}</p>
          <p className="text-sm text-[var(--text-2)]">{doc.recipient_phone ?? "—"}</p>
        </div>
        <div className="surface p-4">
          <p className="mb-1 text-[12px] text-[var(--text-2)]">Montant & échéance</p>
          <p className="text-2xl font-semibold tabular-nums">
            {doc.amount != null ? formatEuro(Number(doc.amount)) : "—"}
          </p>
          <p className="mt-0.5 text-sm text-[var(--text-2)]">
            {doc.due_date ? `Échéance ${formatDate(doc.due_date)}` : "Pas d'échéance"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {doc.status === "draft" && (
          <form action={markSentAction}>
            <input type="hidden" name="documentId" value={doc.id} />
            <button type="submit" className="btn btn-primary">
              Marquer comme envoyé
            </button>
          </form>
        )}
        {doc.doc_type === "facture" && doc.status !== "paid" && (
          <form action={markPaidAction}>
            <input type="hidden" name="documentId" value={doc.id} />
            <button type="submit" className="btn btn-ghost">
              Marquer comme payé
            </button>
          </form>
        )}
        {doc.doc_type === "contrat" && doc.status !== "signed" && (
          <SignatureControl documentId={doc.id} />
        )}
        {doc.status !== "cancelled" && (
          <form action={updateDocumentStatusAction}>
            <input type="hidden" name="documentId" value={doc.id} />
            <input type="hidden" name="status" value="cancelled" />
            <button type="submit" className="btn btn-ghost">
              Annuler
            </button>
          </form>
        )}
        <form action={deleteDocumentAction}>
          <input type="hidden" name="documentId" value={doc.id} />
          <ConfirmButton
            message="Supprimer ce document ?"
            className="btn btn-ghost"
            style={{ color: "var(--red)" }}
          >
            Supprimer
          </ConfirmButton>
        </form>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-[var(--text-2)]">Relances</h2>
        <ReminderControls documentId={doc.id} hasEmail={!!doc.recipient_email} hasPhone={!!doc.recipient_phone} />
        {reminders.length === 0 ? (
          <p className="surface p-4 text-center text-sm text-[var(--text-2)]">Aucune relance.</p>
        ) : (
          <ul className="surface flex flex-col divide-y divide-[var(--border)] p-0">
            {reminders.map((r) => (
              <li key={r.id} className="flex items-center justify-between p-3 text-sm">
                <span>
                  Relance #{r.reminder_number} · {r.channel.toUpperCase()}
                </span>
                <span className="text-[var(--text-2)]">{formatDateTime(r.sent_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
