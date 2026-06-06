import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { ContactForm } from "@/components/crm/ContactForm";

export const metadata = { title: "CRM — Nouveau contact" };

export default async function NewContactPage() {
  await requireModule("crm");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/crm" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Contacts
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Nouveau contact</h1>
      </div>
      <ContactForm mode="create" />
    </div>
  );
}
