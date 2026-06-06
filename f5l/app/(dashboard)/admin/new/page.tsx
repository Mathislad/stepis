import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { NewDocumentForm } from "@/components/admin/NewDocumentForm";

export const metadata = { title: "Documents — Nouveau" };

export default async function NewDocumentPage() {
  await requireModule("admin");
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/admin" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Mes documents
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Nouveau document</h1>
      </div>
      <NewDocumentForm />
    </div>
  );
}
