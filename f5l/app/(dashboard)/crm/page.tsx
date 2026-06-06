import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { listContacts } from "@/lib/crm/contacts";
import { getCrmStats } from "@/lib/crm/stats";
import { StatsBar } from "@/components/crm/StatsBar";
import { ContactFilters } from "@/components/crm/ContactFilters";
import { ContactList } from "@/components/crm/ContactList";
import type { ContactSource, ContactType, PipelineStatus } from "@/types/database";

export const metadata = { title: "CRM — Contacts" };

const PIPELINE: PipelineStatus[] = ["lead", "qualified", "proposal", "won", "lost"];
const SOURCES: ContactSource[] = ["f5l_acquisition", "manual", "site_form", "loyalty", "other"];

export default async function CrmContactsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    status?: string;
    source?: string;
    q?: string;
    page?: string;
  }>;
}) {
  await requireModule("crm");
  const sp = await searchParams;

  // Validation stricte des enums avant requête (évite un cast Postgres invalide).
  const type: ContactType | undefined =
    sp.type === "b2b" || sp.type === "b2c" ? sp.type : undefined;
  const status = PIPELINE.includes(sp.status as PipelineStatus)
    ? (sp.status as PipelineStatus)
    : undefined;
  const source = SOURCES.includes(sp.source as ContactSource)
    ? (sp.source as ContactSource)
    : undefined;
  const search = sp.q?.trim() || undefined;
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;

  const [stats, result] = await Promise.all([
    getCrmStats(),
    listContacts({ type, status, source, search, page }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">CRM</h1>
          <p className="text-sm text-[var(--text-2)]">Contacts & relations</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/crm/leads" className="btn btn-ghost">
            Leads
          </Link>
          <Link href="/crm/new" className="btn btn-primary">
            Nouveau contact
          </Link>
        </div>
      </header>

      <StatsBar stats={stats} />
      <ContactFilters />
      <ContactList
        result={result}
        params={{ type: sp.type, status: sp.status, source: sp.source, q: sp.q }}
      />
    </div>
  );
}
