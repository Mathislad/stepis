import { createClient } from "@/lib/supabase/server";
import type { AdCampaignStatus } from "@/types/database";

export interface ProspectListItem {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string;
  source_url: string | null;
  status: string;
  created_at: string;
}

export interface CampaignTileData {
  id: string;
  title: string;
  platform: string;
  status: AdCampaignStatus;
  budget: number;
  duration_days: number;
  leadsCount: number;
  spend: number;
  cpl: number | null;
}

export interface AcquisitionMetrics {
  /** Prospects (leads) ce mois calendaire. */
  prospectsThisMonth: number;
  prospectsPrevMonth: number;
  /** Total dépensé en pubs (somme spend reports), périmètre = ce mois. */
  spendThisMonth: number;
  /** Coût par prospect = spend / prospects (null si pas de leads). */
  cpl: number | null;
  /** Campagnes actuellement actives. */
  activeCampaigns: number;
  /** Taux de conversion : leads.status='converted' / total leads ce mois (en %). */
  conversionRatePct: number;
  /** Total ROI : nombre de contacts source='f5l_acquisition' (lifetime). */
  contactsBroughtByF5L: number;
  /** Derniers prospects (5 plus récents). */
  recentProspects: ProspectListItem[];
  /** Tuiles des campagnes actives (max 5). */
  campaignTiles: CampaignTileData[];
}

function monthStart(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return d.toISOString();
}
function nextMonthStart(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return d.toISOString();
}
function prevMonthStart(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return d.toISOString();
}

/**
 * Métriques de la page d'accueil (vue ROI F5L Acquisition).
 * RLS auto-scope par org via le client serveur.
 */
export async function getAcquisitionMetrics(): Promise<AcquisitionMetrics> {
  const supabase = await createClient();
  const now = new Date();
  const mStart = monthStart(now);
  const mEnd = nextMonthStart(now);
  const pStart = prevMonthStart(now);

  const [
    leadsThisRes,
    leadsPrevRes,
    leadsConvertedRes,
    contactsRoiRes,
    activeCampaignsRes,
    recentLeadsRes,
    campaignsRes,
    reportsRes,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", mStart)
      .lt("created_at", mEnd),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", pStart)
      .lt("created_at", mStart),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "converted")
      .gte("created_at", mStart),
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("source", "f5l_acquisition"),
    supabase
      .from("ad_campaigns")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("leads")
      .select("id, name, phone, email, source, source_url, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("ad_campaigns")
      .select("id, title, platform, status, budget, duration_days")
      .in("status", ["active", "paused"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("ad_campaign_reports")
      .select("campaign_id, leads_count, spend")
      .gte("report_date", mStart.slice(0, 10)),
  ]);

  const prospectsThisMonth = leadsThisRes.count ?? 0;
  const prospectsPrevMonth = leadsPrevRes.count ?? 0;
  const convertedThis = leadsConvertedRes.count ?? 0;

  // Agrégats par campagne pour la tuile.
  const aggByCampaign = new Map<string, { leads: number; spend: number }>();
  let spendThisMonth = 0;
  for (const r of reportsRes.data ?? []) {
    const cur = aggByCampaign.get(r.campaign_id) ?? { leads: 0, spend: 0 };
    cur.leads += r.leads_count;
    cur.spend += Number(r.spend);
    aggByCampaign.set(r.campaign_id, cur);
    spendThisMonth += Number(r.spend);
  }

  const campaignTiles: CampaignTileData[] = (campaignsRes.data ?? []).map((c) => {
    const agg = aggByCampaign.get(c.id);
    const leadsCount = agg?.leads ?? 0;
    const spend = agg?.spend ?? 0;
    return {
      id: c.id,
      title: c.title,
      platform: c.platform,
      status: c.status,
      budget: Number(c.budget),
      duration_days: c.duration_days,
      leadsCount,
      spend,
      cpl: leadsCount > 0 ? spend / leadsCount : null,
    };
  });

  const cpl =
    prospectsThisMonth > 0 && spendThisMonth > 0 ? spendThisMonth / prospectsThisMonth : null;

  const conversionRatePct =
    prospectsThisMonth > 0 ? Math.round((convertedThis / prospectsThisMonth) * 100) : 0;

  return {
    prospectsThisMonth,
    prospectsPrevMonth,
    spendThisMonth,
    cpl,
    activeCampaigns: activeCampaignsRes.count ?? 0,
    conversionRatePct,
    contactsBroughtByF5L: contactsRoiRes.count ?? 0,
    recentProspects: (recentLeadsRes.data ?? []) as ProspectListItem[],
    campaignTiles,
  };
}

/** Source humaine d'un lead, prête à afficher. */
export function leadSourceLabel(source: string, sourceUrl: string | null): string {
  if (source === "f5l_acquisition") {
    if (sourceUrl?.includes("facebook") || sourceUrl?.includes("instagram")) return "Meta Ads";
    if (sourceUrl?.includes("google")) return "Google Ads";
    return "Publicité F5L";
  }
  if (source === "site_form") return "Ma page";
  if (source === "loyalty") return "Carte fidélité";
  if (source === "manual") return "Ajouté manuellement";
  return "Autre";
}
