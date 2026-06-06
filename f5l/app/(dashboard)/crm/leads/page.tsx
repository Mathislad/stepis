import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { listLeads } from "@/lib/crm/leads";
import { LeadCard } from "@/components/crm/LeadCard";

export const metadata = { title: "CRM — Leads" };

const CONVERT_NOTICE: Record<string, string> = {
  exists: "Ce lead a déjà été converti en contact.",
  missing: "Lead introuvable.",
  error: "La conversion a échoué, réessayez.",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ convert?: string }>;
}) {
  await requireModule("crm");
  const sp = await searchParams;
  const leads = await listLeads();
  const notice = sp.convert ? CONVERT_NOTICE[sp.convert] : undefined;
  const newCount = leads.filter((l) => l.status === "new").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/crm" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Contacts
        </Link>
        <div className="mt-1 flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold">Leads entrants</h1>
          {newCount > 0 && (
            <span className="text-sm text-[var(--text-2)]">{newCount} nouveau(x)</span>
          )}
        </div>
        <p className="text-sm text-[var(--text-2)]">
          Demandes issues du site — qualifiez-les puis convertissez-les en contacts.
        </p>
      </div>

      {notice && (
        <p
          className="surface px-4 py-3 text-sm"
          style={{ color: "var(--amber)", borderColor: "rgba(255,159,10,0.35)" }}
          role="status"
        >
          {notice}
        </p>
      )}

      {leads.length === 0 ? (
        <div className="surface flex flex-col items-center gap-2 px-5 py-16 text-center">
          <p className="text-3xl">📥</p>
          <p className="font-medium">Aucun lead</p>
          <p className="max-w-xs text-sm text-[var(--text-2)]">
            Les demandes reçues depuis votre site apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
