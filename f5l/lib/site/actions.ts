"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireModule } from "@/lib/auth/require-module";
import { createClient } from "@/lib/supabase/server";
import {
  deleteBlock,
  getOrgNotify,
  getSiteContent,
  reorderBlocks,
  togglePublished,
  upsertBlock,
} from "@/lib/site/content";
import { createOffer, deleteOffer, updateOffer } from "@/lib/site/offers";
import { defaultContent, WEEK_DAYS } from "@/lib/site/blocks";
import { notifyNewLead } from "@/lib/brevo/notify";
import type { BlockType, Json } from "@/types/database";

export interface SiteFormState {
  ok: boolean;
  error: string | null;
}
export interface LeadFormState {
  ok: boolean;
  error: string | null;
}

const BLOCK_TYPES: BlockType[] = ["text", "price", "hours", "offer", "image"];

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function optStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}
function truncate(value: string | null, max: number): string | null {
  return value && value.length > max ? value.slice(0, max) : value;
}
function safeSourceUrl(value: string | null): string | null {
  if (!value) return null;
  if (value.length > 500) return value.slice(0, 500);
  return value;
}

/** Révalide le dashboard + le site public de l'org (slug résolu serveur-side). */
function revalidateSite(slug: string) {
  revalidatePath("/site");
  revalidatePath(`/p/${slug}`);
}

function parseContent(type: BlockType, fd: FormData): Json {
  switch (type) {
    case "text":
      return { title: str(fd, "title"), body: str(fd, "body") };
    case "price":
      return { label: str(fd, "label"), amount: str(fd, "amount"), unit: str(fd, "unit") };
    case "image":
      return { url: str(fd, "url"), alt: str(fd, "alt") };
    case "offer":
      return { offerId: optStr(fd, "offerId") };
    case "hours":
      return {
        days: WEEK_DAYS.map((label, i) => ({
          label,
          open: str(fd, `day_${i}_open`) || "09:00",
          close: str(fd, `day_${i}_close`) || "18:00",
          closed: fd.get(`day_${i}_closed`) === "on",
        })),
      };
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

// ── Blocs ─────────────────────────────────────────────────────────────────--
export async function saveBlockAction(
  _prev: SiteFormState,
  fd: FormData,
): Promise<SiteFormState> {
  const ctx = await requireModule("site");
  const blockKey = str(fd, "blockKey");
  const blockType = str(fd, "blockType") as BlockType;
  const position = Number(str(fd, "position")) || 0;
  if (!blockKey || !BLOCK_TYPES.includes(blockType)) {
    return { ok: false, error: "Bloc invalide." };
  }
  try {
    await upsertBlock({ blockKey, blockType, content: parseContent(blockType, fd), position });
  } catch {
    return { ok: false, error: "Enregistrement impossible." };
  }
  revalidatePath(`/site/edit/${blockKey}`);
  revalidateSite(ctx.org.slug);
  return { ok: true, error: null };
}

export async function addBlockAction(fd: FormData): Promise<void> {
  const ctx = await requireModule("site");
  const blockType = str(fd, "blockType") as BlockType;
  if (!BLOCK_TYPES.includes(blockType)) redirect("/site");

  const existing = await getSiteContent();
  const blockKey = `${blockType}-${crypto.randomUUID().slice(0, 8)}`;
  await upsertBlock({
    blockKey,
    blockType,
    content: defaultContent(blockType),
    position: existing.length,
    published: false,
  });
  revalidateSite(ctx.org.slug);
  redirect(`/site/edit/${blockKey}`);
}

export async function deleteBlockAction(fd: FormData): Promise<void> {
  const ctx = await requireModule("site");
  const id = str(fd, "blockId");
  if (id) {
    try {
      await deleteBlock(id);
    } catch {
      /* best-effort */
    }
  }
  revalidateSite(ctx.org.slug);
  redirect("/site");
}

export async function moveBlockAction(fd: FormData): Promise<void> {
  const ctx = await requireModule("site");
  const blockId = str(fd, "blockId");
  const direction = str(fd, "direction"); // "up" | "down"

  const blocks = await getSiteContent();
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx !== -1) {
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (swap >= 0 && swap < blocks.length) {
      const ids = blocks.map((b) => b.id);
      const tmp = ids[idx];
      ids[idx] = ids[swap];
      ids[swap] = tmp;
      await reorderBlocks(ids);
    }
  }
  revalidateSite(ctx.org.slug);
}

export async function togglePublishedAction(fd: FormData): Promise<void> {
  const ctx = await requireModule("site");
  const id = str(fd, "blockId");
  const published = str(fd, "published") === "true"; // état cible
  if (id) {
    try {
      await togglePublished(id, published);
    } catch {
      /* best-effort */
    }
  }
  revalidateSite(ctx.org.slug);
}

/** Primitive (non utilisée par l'UI ↑/↓, fournie pour un futur drag-and-drop). */
export async function reorderBlocksAction(orderedIds: string[]): Promise<void> {
  const ctx = await requireModule("site");
  await reorderBlocks(orderedIds);
  revalidateSite(ctx.org.slug);
}

// ── Offres ────────────────────────────────────────────────────────────────--
export async function saveOfferAction(
  _prev: SiteFormState,
  fd: FormData,
): Promise<SiteFormState> {
  const ctx = await requireModule("site");
  const id = optStr(fd, "offerId");
  const title = str(fd, "title");
  if (!title) return { ok: false, error: "Le titre est requis." };

  const input = {
    title,
    description: optStr(fd, "description"),
    discount: optStr(fd, "discount"),
    valid_from: optStr(fd, "valid_from"),
    valid_until: optStr(fd, "valid_until"),
    active: fd.get("active") === "on",
  };
  try {
    if (id) await updateOffer(id, input);
    else await createOffer(input);
  } catch {
    return { ok: false, error: "Enregistrement impossible." };
  }
  revalidatePath("/site/offers");
  revalidateSite(ctx.org.slug);
  redirect("/site/offers");
}

export async function deleteOfferAction(fd: FormData): Promise<void> {
  const ctx = await requireModule("site");
  const id = str(fd, "offerId");
  if (id) {
    try {
      await deleteOffer(id);
    } catch {
      /* best-effort */
    }
  }
  revalidatePath("/site/offers");
  revalidateSite(ctx.org.slug);
}

// ── Capture de lead (PUBLIC — pas de requireModule) ─────────────────────────
export async function captureLeadAction(
  _prev: LeadFormState,
  fd: FormData,
): Promise<LeadFormState> {
  const slug = str(fd, "slug");
  const name = str(fd, "name");
  const phone = str(fd, "phone");
  const email = truncate(str(fd, "email"), 180) ?? "";
  const message = truncate(str(fd, "message"), 1200) ?? "";
  const requestHeaders = await headers();
  const sourceUrl = safeSourceUrl(optStr(fd, "sourceUrl") ?? requestHeaders.get("referer"));

  if (!slug) return { ok: false, error: "Site introuvable." };
  if (!name || !phone) return { ok: false, error: "Le nom et le téléphone sont requis." };
  if (name.length > 120 || phone.length > 40) {
    return { ok: false, error: "Nom ou téléphone trop long." };
  }

  // 1. Création du lead via RPC SECURITY DEFINER (org_id résolu serveur-side).
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_public_lead", {
    p_slug: slug,
    p_name: name,
    p_phone: phone,
    p_email: email,
    p_message: message,
    p_source_url: sourceUrl,
  });
  if (error) {
    return { ok: false, error: "Envoi impossible, réessayez dans un instant." };
  }

  // 2. Notifications Brevo — best-effort, n'échoue JAMAIS la capture du lead.
  try {
    const org = await getOrgNotify(slug);
    if (org) {
      await notifyNewLead(org, {
        name,
        phone,
        email: email || null,
        message: message || null,
      });
    }
  } catch (e) {
    console.error("[captureLead] notification:", e);
  }

  return { ok: true, error: null };
}
