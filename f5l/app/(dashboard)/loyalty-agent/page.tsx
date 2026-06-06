import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import {
  getCampaign,
  getLoyaltyAgentStats,
  listCampaigns,
  listRecentMessages,
} from "@/lib/loyalty-agent/campaigns";
import { CampaignForm } from "@/components/loyalty-agent/CampaignForm";
import { CampaignList } from "@/components/loyalty-agent/CampaignList";
import { CampaignPreview } from "@/components/loyalty-agent/CampaignPreview";
import { RecentMessages } from "@/components/loyalty-agent/RecentMessages";
import { buildCampaignDrafts } from "@/lib/loyalty-agent/engine";

export const metadata = { title: "Agent Fidélisation" };

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="surface p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[12px] text-[var(--text-2)]">{label}</p>
    </div>
  );
}

export default async function LoyaltyAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const ctx = await requireModule("loyalty_agent");
  const sp = await searchParams;
  const [campaigns, stats, recentMessages, editing] = await Promise.all([
    listCampaigns(),
    getLoyaltyAgentStats(),
    listRecentMessages(),
    sp.edit ? getCampaign(sp.edit) : Promise.resolve(null),
  ]);
  const previewDrafts = editing
    ? await buildCampaignDrafts(editing, ctx.org.name)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Agent Fidélisation</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-2)]">
          Séquences automatiques pour anniversaires, clients inactifs,
          remerciements post-achat et campagnes saisonnières.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Campagnes" value={stats.totalCampaigns} />
        <Stat label="Actives" value={stats.activeCampaigns} />
        <Stat label="SMS" value={stats.smsCampaigns} />
        <Stat label="E-mails" value={stats.emailCampaigns} />
        <Stat label="Quota SMS" value={`${stats.smsUsed}/${stats.smsLimit}`} />
        <Stat label="Quota e-mails" value={`${stats.emailUsed}/${stats.emailLimit}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-medium text-[var(--text-2)]">
              {editing ? "Modifier la campagne" : "Nouvelle campagne"}
            </h2>
            {editing && (
              <Link
                href="/loyalty-agent"
                className="mt-1 inline-flex text-[13px] text-[var(--text-2)] hover:text-[var(--text)]"
              >
                Annuler la modification
              </Link>
            )}
          </div>
          <CampaignForm key={editing?.id ?? "new"} campaign={editing ?? undefined} />
          {editing && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-[var(--text-2)]">
                Prévisualisation
              </h2>
              <CampaignPreview drafts={previewDrafts} />
            </section>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-[var(--text-2)]">Campagnes</h2>
          <CampaignList
            campaigns={campaigns}
            managerEnabled={ctx.enabledModules.has("manager")}
          />
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-[var(--text-2)]">Derniers envois</h2>
        <RecentMessages messages={recentMessages} />
      </section>
    </div>
  );
}
