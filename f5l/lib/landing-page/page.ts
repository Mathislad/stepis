import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrgId } from "@/lib/auth/context";
import type { Json } from "@/types/database";

/**
 * Modèle « landing page F5L Acquisition ». Stocké dans `site_content` avec
 * des `block_key` réservés : on encapsule la table multi-blocs derrière une
 * API structurée (one-page, sections fixes).
 */
export interface LandingHero {
  title: string;
  subtitle: string;
  ctaLabel: string;
}
export interface LandingService {
  title: string;
  description: string;
}
export interface LandingTestimonial {
  author: string;
  quote: string;
}
export interface LandingHours {
  days: { label: string; open: string; close: string; closed: boolean }[];
}
export interface LandingInfo {
  address: string;
  city: string;
  phone: string;
}

export interface LandingPage {
  hero: LandingHero;
  services: LandingService[];
  testimonials: LandingTestimonial[];
  hours: LandingHours | null;
  info: LandingInfo;
  published: boolean;
}

const WEEK_DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
] as const;

function defaultHours(): LandingHours {
  return {
    days: WEEK_DAYS.map((label) => ({ label, open: "09:00", close: "18:00", closed: false })),
  };
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}
function s(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Décode un Json en `LandingHero` (défensif). */
function parseHero(content: unknown): LandingHero {
  const o = obj(content);
  return {
    title: s(o.title) || "Bienvenue",
    subtitle: s(o.subtitle),
    ctaLabel: s(o.ctaLabel) || "Nous contacter",
  };
}
function parseService(content: unknown): LandingService {
  const o = obj(content);
  return { title: s(o.title), description: s(o.description) };
}
function parseTestimonial(content: unknown): LandingTestimonial {
  const o = obj(content);
  return { author: s(o.author), quote: s(o.quote) };
}
function parseHours(content: unknown): LandingHours {
  const o = obj(content);
  const raw = Array.isArray(o.days) ? o.days : [];
  return {
    days: WEEK_DAYS.map((label, i) => {
      const d = obj(raw[i]);
      return {
        label,
        open: s(d.open) || "09:00",
        close: s(d.close) || "18:00",
        closed: d.closed === true,
      };
    }),
  };
}
function parseInfo(content: unknown): LandingInfo {
  const o = obj(content);
  return {
    address: s(o.address),
    city: s(o.city),
    phone: s(o.phone),
  };
}

const SERVICE_KEYS = ["service-1", "service-2", "service-3", "service-4", "service-5", "service-6"];
const TESTIMONIAL_KEYS = ["testimonial-1", "testimonial-2", "testimonial-3"];

/** Charge la landing page courante (RLS auto-scope par org). */
export async function getLandingPage(): Promise<LandingPage> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_content").select("*");
  if (error) throw new Error(`getLandingPage: ${error.message}`);
  const blocks = data ?? [];
  const byKey = new Map(blocks.map((b) => [b.block_key, b]));

  const hero = parseHero(byKey.get("hero")?.content);
  const services = SERVICE_KEYS.map((k) => parseService(byKey.get(k)?.content)).filter(
    (s) => s.title.trim().length > 0,
  );
  const testimonials = TESTIMONIAL_KEYS.map((k) =>
    parseTestimonial(byKey.get(k)?.content),
  ).filter((t) => t.quote.trim().length > 0);
  const hours = byKey.has("hours") ? parseHours(byKey.get("hours")?.content) : defaultHours();
  const info = parseInfo(byKey.get("info")?.content);

  // « Publié » si au moins le hero est marqué published.
  const published = byKey.get("hero")?.published === true;

  return { hero, services, testimonials, hours, info, published };
}

export interface SaveLandingPageInput {
  hero: LandingHero;
  services: LandingService[]; // jusqu'à 6
  testimonials: LandingTestimonial[]; // jusqu'à 3
  hours: LandingHours;
  info: LandingInfo;
  published: boolean;
}

/**
 * Persiste la landing page complète en upsertant chaque section.
 * Les sections vides (services, testimonials non remplis) sont marquées
 * non publiées plutôt que supprimées, pour préserver leur historique.
 */
export async function saveLandingPage(input: SaveLandingPageInput): Promise<void> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("Organisation introuvable.");

  const rows: {
    org_id: string;
    block_key: string;
    block_type: "text" | "hours";
    content: Json;
    position: number;
    published: boolean;
  }[] = [];

  rows.push({
    org_id: orgId,
    block_key: "hero",
    block_type: "text",
    content: { ...input.hero } as unknown as Json,
    position: 0,
    published: input.published,
  });

  SERVICE_KEYS.forEach((key, i) => {
    const svc = input.services[i] ?? { title: "", description: "" };
    rows.push({
      org_id: orgId,
      block_key: key,
      block_type: "text",
      content: { ...svc } as unknown as Json,
      position: 10 + i,
      published: input.published && svc.title.trim().length > 0,
    });
  });

  TESTIMONIAL_KEYS.forEach((key, i) => {
    const t = input.testimonials[i] ?? { author: "", quote: "" };
    rows.push({
      org_id: orgId,
      block_key: key,
      block_type: "text",
      content: { ...t } as unknown as Json,
      position: 20 + i,
      published: input.published && t.quote.trim().length > 0,
    });
  });

  rows.push({
    org_id: orgId,
    block_key: "hours",
    block_type: "hours",
    content: { ...input.hours } as unknown as Json,
    position: 30,
    published: input.published,
  });

  rows.push({
    org_id: orgId,
    block_key: "info",
    block_type: "text",
    content: { ...input.info } as unknown as Json,
    position: 40,
    published: input.published,
  });

  const { error } = await supabase
    .from("site_content")
    .upsert(rows, { onConflict: "org_id,block_key" });
  if (error) throw new Error(`saveLandingPage: ${error.message}`);
}

/** Version publique (client admin, scope par slug). */
export async function getPublicLandingPage(slug: string): Promise<{
  org: { id: string; name: string; slug: string; sector: string | null };
  page: LandingPage;
} | null> {
  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id, name, slug, sector")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) return null;

  const { data: blocks } = await admin
    .from("site_content")
    .select("*")
    .eq("org_id", org.id)
    .eq("published", true);

  const byKey = new Map((blocks ?? []).map((b) => [b.block_key, b]));
  const hero = parseHero(byKey.get("hero")?.content);
  const services = SERVICE_KEYS.map((k) => parseService(byKey.get(k)?.content)).filter(
    (s) => s.title.trim().length > 0,
  );
  const testimonials = TESTIMONIAL_KEYS.map((k) =>
    parseTestimonial(byKey.get(k)?.content),
  ).filter((t) => t.quote.trim().length > 0);
  const hours = byKey.has("hours") ? parseHours(byKey.get("hours")?.content) : null;
  const info = parseInfo(byKey.get("info")?.content);

  return {
    org,
    page: { hero, services, testimonials, hours, info, published: true },
  };
}
