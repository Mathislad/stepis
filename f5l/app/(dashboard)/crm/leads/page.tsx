import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { listLeads } from "@/lib/crm/leads";
import { LeadCard } from "@/components/crm/LeadCard";

// UX-FIX: « Leads » → « Demandes de contact », « Conversion » → « Transformer en client »
export const metadata = { title: "Demandes de contact" };

const CONVERT_NOTICE: Record<string, string> = {
  exists: "Cette demande a déjà été transformée en client.",
  missing: "Demande introuvable.",
  error: "Impossible de transformer cette demande, réessayez.",
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
          ← Mes clients
        </Link>
        <div className="mt-1 flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold">Demandes de contact</h1>
          {newCount > 0 && (
            <span className="text-sm text-[var(--text-2)]">{newCount} nouvelle(s)</span>
          )}
        </div>
        <p className="text-sm text-[var(--text-2)]">
          Demandes reçues via votre site — rappelez-les ou transformez-les en client.
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
          <p className="font-medium">Aucune demande pour l&apos;instant</p>
          <p className="max-w-xs text-sm text-[var(--text-2)]">
            Les demandes reçues via le formulaire de votre site apparaîtront ici.
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
