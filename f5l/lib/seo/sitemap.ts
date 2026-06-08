import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority: number;
}

function appOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").origin;
  } catch {
    return "http://localhost:3000";
  }
}

/**
 * Liste les entrées du sitemap public : une entrée par org ayant au moins un
 * bloc de site publié, vers `/p/[slug]`. Lecture via client admin (anon ne
 * passe pas la RLS), strictement scopée à des données déjà publiques.
 */
export async function listPublicSiteEntries(): Promise<SitemapEntry[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  const admin = createAdminClient();
  const { data: publishedBlocks, error: blocksError } = await admin
    .from("site_content")
    .select("org_id, updated_at")
    .eq("published", true);
  if (blocksError || !publishedBlocks?.length) return [];

  const latestByOrg = new Map<string, string>();
  for (const block of publishedBlocks) {
    const current = latestByOrg.get(block.org_id);
    if (!current || block.updated_at > current) latestByOrg.set(block.org_id, block.updated_at);
  }

  const { data: orgs, error: orgsError } = await admin
    .from("organizations")
    .select("id, slug, updated_at")
    .in("id", [...latestByOrg.keys()]);
  if (orgsError || !orgs?.length) return [];

  const origin = appOrigin();
  return orgs.map((org) => ({
    url: `${origin}/p/${org.slug}`,
    lastModified: new Date(latestByOrg.get(org.id) ?? org.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}
