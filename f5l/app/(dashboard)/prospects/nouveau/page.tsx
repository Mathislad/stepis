import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-module";
import { ContactForm } from "@/components/crm/ContactForm";

export const metadata = { title: "Nouveau prospect — F5L" };

export default async function NewProspectPage() {
  await requireAuth();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/prospects" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Mes prospects
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Ajouter un prospect</h1>
        <p className="text-sm text-[var(--text-2)]">
          Un client qui vous a contacté par d&apos;autres moyens (téléphone, en personne…).
        </p>
      </div>
      <ContactForm mode="create" />
    </div>
  );
}
