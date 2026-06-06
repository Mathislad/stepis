import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { listEligibleContacts } from "@/lib/loyalty/cards";
import { NewCardForm } from "@/components/loyalty/NewCardForm";

export const metadata = { title: "Fidélité — Nouvelle carte" };

export default async function NewCardPage() {
  await requireModule("loyalty_card");
  const contacts = await listEligibleContacts();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <Link href="/loyalty" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Fidélité
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Nouvelle carte</h1>
        <p className="text-sm text-[var(--text-2)]">
          Choisissez un contact à qui attribuer une carte de fidélité.
        </p>
      </div>
      <NewCardForm contacts={contacts} />
    </div>
  );
}
