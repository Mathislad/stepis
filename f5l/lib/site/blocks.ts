import type { BlockType, Json, SiteContentRow } from "@/types/database";

// ── Formes de contenu par type de bloc (stockées en jsonb) ──────────────────
export interface TextContent {
  title: string;
  body: string;
}
export interface PriceContent {
  label: string;
  amount: string;
  unit: string;
}
export interface HoursDay {
  label: string;
  open: string;
  close: string;
  closed: boolean;
}
export interface HoursContent {
  days: HoursDay[];
}
export interface OfferContent {
  offerId: string | null;
}
export interface ImageContent {
  url: string;
  alt: string;
}

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: "Texte",
  price: "Prix",
  hours: "Horaires",
  offer: "Offre",
  image: "Image",
};

export const BLOCK_TYPE_GLYPHS: Record<BlockType, string> = {
  text: "📝",
  price: "🏷️",
  hours: "🕒",
  offer: "🎁",
  image: "🖼️",
};

export const WEEK_DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
] as const;

function obj(c: unknown): Record<string, unknown> {
  return c && typeof c === "object" ? (c as Record<string, unknown>) : {};
}
function s(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// ── Lecteurs défensifs (le jsonb peut être incomplet) ───────────────────────
export function asText(c: Json | unknown): TextContent {
  const o = obj(c);
  return { title: s(o.title), body: s(o.body) };
}
export function asPrice(c: Json | unknown): PriceContent {
  const o = obj(c);
  return { label: s(o.label), amount: s(o.amount), unit: s(o.unit) };
}
export function asHours(c: Json | unknown): HoursContent {
  const o = obj(c);
  const raw = Array.isArray(o.days) ? o.days : [];
  const days: HoursDay[] = WEEK_DAYS.map((label, i) => {
    const d = obj(raw[i]);
    return {
      label,
      open: s(d.open) || "09:00",
      close: s(d.close) || "18:00",
      closed: d.closed === true,
    };
  });
  return { days };
}
export function asOffer(c: Json | unknown): OfferContent {
  const o = obj(c);
  return { offerId: typeof o.offerId === "string" ? o.offerId : null };
}
export function asImage(c: Json | unknown): ImageContent {
  const o = obj(c);
  return { url: s(o.url), alt: s(o.alt) };
}

export function defaultContent(type: BlockType): Json {
  switch (type) {
    case "text":
      return { title: "", body: "" };
    case "price":
      return { label: "", amount: "", unit: "" };
    case "hours":
      return {
        days: WEEK_DAYS.map((label) => ({ label, open: "09:00", close: "18:00", closed: false })),
      };
    case "offer":
      return { offerId: null };
    case "image":
      return { url: "", alt: "" };
  }
}

/** Aperçu court d'un bloc pour la liste du dashboard. */
export function blockPreview(block: SiteContentRow): string {
  switch (block.block_type) {
    case "text": {
      const t = asText(block.content);
      return t.title || t.body || "Bloc texte vide";
    }
    case "price": {
      const p = asPrice(block.content);
      return p.label ? `${p.label} — ${p.amount} ${p.unit}`.trim() : "Prix vide";
    }
    case "hours":
      return "Horaires d'ouverture";
    case "offer": {
      const o = asOffer(block.content);
      return o.offerId ? "Offre liée" : "Aucune offre sélectionnée";
    }
    case "image": {
      const i = asImage(block.content);
      return i.url || "Aucune image";
    }
  }
}
