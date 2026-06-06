import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { listDocuments } from "@/lib/admin/documents";
import { getAdminStats } from "@/lib/admin/stats";
import { DOC_TYPE_LABELS, STATUS_LABELS, STATUS_TONES } from "@/lib/admin/labels";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatEuro } from "@/lib/utils";
import type { DocumentStatus, DocumentType } from "@/types/database";

export const metadata = { title: "Documents" };

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="surface p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[12px] text-[var(--text-2)]">{label}</p>
    </div>
  );
}

const TYPES: DocumentType[] = ["devis", "facture", "contrat"];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; page?: string }>;
}) {
  await requireModule("admin");
  const sp = await searchParams;
  const type = TYPES.find((t) => t === sp.type);
  const status = (["draft", "sent", "signed", "paid", "overdue", "cancelled"] as DocumentStatus[]).find((s) => s === sp.status);
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;

  const [stats, result] = await Promise.all([
    getAdminStats(),
    listDocuments({ type, status, page }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mes documents</h1>
          <p className="text-sm text-[var(--text-2)]">Devis, factures, contrats</p>
        </div>
        <Link href="/admin/new" className="btn btn-primary">
          + Nouveau document
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Documents au total" value={stats.totalDocuments} />
        <Stat label="En attente de signature" value={stats.awaitingSignature} />
        <Stat label="Factures en retard" value={stats.overdue} />
        <Stat label="Facturé" value={formatEuro(stats.totalBilled)} />
      </div>

      <nav className="flex flex-wrap gap-2 text-[13px]">
        <Link href="/admin" className={`btn btn-ghost py-1.5 ${!type ? "border-[var(--border-strong)]" : ""}`}>
          Tous
        </Link>
        {TYPES.map((t) => (
          <Link
            key={t}
            href={`/admin?type=${t}`}
            className={`btn btn-ghost py-1.5 ${type === t ? "border-[var(--border-strong)]" : ""}`}
          >
            {DOC_TYPE_LABELS[t]}
          </Link>
        ))}
      </nav>

      {result.rows.length === 0 ? (
        <div className="surface flex flex-col items-center gap-2 px-5 py-14 text-center">
          <p className="text-3xl">📄</p>
          <p className="font-medium">Aucun document</p>
          <p className="max-w-xs text-sm text-[var(--text-2)]">
            Créez votre premier devis, facture ou contrat.
          </p>
          <Link href="/admin/new" className="btn btn-primary mt-2">
            + Nouveau document
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {result.rows.map((d) => (
            <li key={d.id} className="surface surface-hover p-4">
              <Link href={`/admin/${d.id}`} className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] uppercase text-[var(--muted)]">
                      {DOC_TYPE_LABELS[d.doc_type]}
                    </span>
                    <span className="truncate font-medium">{d.title}</span>
                    <Badge tone={STATUS_TONES[d.status]}>{STATUS_LABELS[d.status]}</Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-[var(--text-2)]">
                    {d.recipient_name ?? "—"}
                    {d.amount != null && ` · ${formatEuro(Number(d.amount))}`}
                    {d.due_date && ` · échéance ${formatDate(d.due_date)}`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
