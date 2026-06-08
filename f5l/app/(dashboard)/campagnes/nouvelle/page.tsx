import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-module";
import { CampaignWizard } from "@/components/campagnes/CampaignWizard";

export const metadata = { title: "Nouvelle campagne — F5L" };

export default async function NewCampaignPage() {
  await requireAuth();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/campagnes" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Mes campagnes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Nouvelle campagne</h1>
        <p className="text-sm text-[var(--text-2)]">
          5 étapes pour lancer votre publicité — moins de 5 minutes.
        </p>
      </div>
      <CampaignWizard />
    </div>
  );
}
