import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicSite } from "@/lib/site/content";
import { asOffer, asText } from "@/lib/site/blocks";
import { PublicBlocks } from "@/components/public/PublicBlocks";
import { PublicOffers } from "@/components/public/PublicOffers";
import { LeadForm } from "./LeadForm";

function cleanDescription(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 155);
}

function siteDescription(site: NonNullable<Awaited<ReturnType<typeof getPublicSite>>>): string {
  const textBlock = site.blocks.find((block) => block.block_type === "text");
  const text = textBlock ? asText(textBlock.content) : null;
  return cleanDescription(
    text?.body || text?.title || site.org.sector || `Page officielle de ${site.org.name}.`,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getPublicSite(slug);
  if (!site) {
    return {
      title: "Site introuvable",
      robots: { index: false, follow: false },
    };
  }

  const title = site.org.name;
  const description = siteDescription(site);
  return {
    title,
    description,
    alternates: { canonical: `/p/${site.org.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/p/${site.org.slug}`,
      siteName: "F5L",
    },
  };
}

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getPublicSite(slug);
  if (!site) notFound();

  // Offres déjà mises en avant par un bloc "offer" → on évite le doublon.
  const referenced = new Set(
    site.blocks
      .filter((b) => b.block_type === "offer")
      .map((b) => asOffer(b.content).offerId)
      .filter((id): id is string => Boolean(id)),
  );
  const standaloneOffers = site.offers.filter((o) => !referenced.has(o.id));

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{site.org.name}</h1>
        {site.org.sector && <p className="mt-1 text-zinc-500">{site.org.sector}</p>}
      </header>

      <PublicBlocks blocks={site.blocks} offers={site.offers} />
      {standaloneOffers.length > 0 && <PublicOffers offers={standaloneOffers} />}

      <section className="mt-12">
        <h2 className="mb-1 text-2xl font-semibold text-zinc-900">Contactez-nous</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Une question, une demande ? Laissez-nous un message.
        </p>
        <LeadForm slug={slug} />
      </section>

      <footer className="mt-14 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400">
        Site propulsé par <span className="font-semibold text-zinc-600">F5L</span>
      </footer>
    </main>
  );
}
