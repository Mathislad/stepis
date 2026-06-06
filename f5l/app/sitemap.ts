import type { MetadataRoute } from "next";
import { listPublicSiteEntries } from "@/lib/seo/sitemap";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return listPublicSiteEntries();
}
