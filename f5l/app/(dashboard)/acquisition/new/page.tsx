import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { NewAdCampaignForm } from "@/components/acquisition/NewAdCampaignForm";

export const metadata = { title: "Acquisition — Nouvelle campagne" };

export default async function NewAcquisitionPage() {
  await requireModule("acquisition");
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/acquisition" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Publicité
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Nouvelle campagne</h1>
      </div>
      <NewAdCampaignForm />
    </div>
  );
}
