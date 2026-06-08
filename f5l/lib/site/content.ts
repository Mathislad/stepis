import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrgId } from "@/lib/auth/context";
import type { BlockType, Json, OfferRow, SiteContentRow } from "@/types/database";

export async function getSiteContent(): Promise<SiteContentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .order("position", { ascending: true });
  if (error) throw new Error(`getSiteContent: ${error.message}`);
  return data ?? [];
}

export async function getBlock(blockKey: string): Promise<SiteContentRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("block_key", blockKey)
    .maybeSingle();
  if (error) throw new Error(`getBlock: ${error.message}`);
  return data ?? null;
}

export interface UpsertBlockInput {
  blockKey: string;
  blockType: BlockType;
  content: Json;
  position: number;
  published?: boolean;
}

/**
 * Crée ou met à jour un bloc (upsert sur `(org_id, block_key)`).
 * `org_id` résolu serveur-side ; `published` omis = inchangé à l'update.
 */
export async function upsertBlock(input: UpsertBlockInput): Promise<SiteContentRow> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("upsertBlock: organisation introuvable.");

  const row = {
    org_id: orgId,
    block_key: input.blockKey,
    block_type: input.blockType,
    content: input.content,
    position: input.position,
    ...(input.published !== undefined ? { published: input.published } : {}),
  };

  const { data, error } = await supabase
    .from("site_content")
    .upsert(row, { onConflict: "org_id,block_key" })
    .select("*")
    .single();
  if (error) throw new Error(`upsertBlock: ${error.message}`);
  return data;
}

export async function deleteBlock(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("site_content").delete().eq("id", id);
  if (error) throw new Error(`deleteBlock: ${error.message}`);
}

/** Réécrit les `position` selon l'ordre fourni (RLS scope par org). */
export async function reorderBlocks(orderedIds: string[]): Promise<void> {
  const supabase = await createClient();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("site_content").update({ position: index }).eq("id", id),
    ),
  );
  for (const r of results) {
    if (r.error) throw new Error(`reorderBlocks: ${r.error.message}`);
  }
}

export async function togglePublished(id: string, published: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_content")
    .update({ published })
    .eq("id", id);
  if (error) throw new Error(`togglePublished: ${error.message}`);
}

// ── Côté public (anon) : client ADMIN, scopé explicitement par slug ─────────
export interface PublicSiteOrg {
  id: string;
  name: string;
  slug: string;
  sector: string | null;
}
export interface PublicSite {
  org: PublicSiteOrg;
  blocks: SiteContentRow[];
  offers: OfferRow[];
}

/**
 * Données du site public d'un commerce (visiteur non authentifié).
 * Client admin (la RLS bloquerait `anon`) MAIS scopé strictement à l'org du
 * slug, et filtré aux blocs publiés + offres actives. `null` si slug inconnu.
 */
export async function getPublicSite(slug: string): Promise<PublicSite | null> {
  const admin = createAdminClient();

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, name, slug, sector")
    .eq("slug", slug)
    .maybeSingle();
  if (orgErr) throw new Error(`getPublicSite: ${orgErr.message}`);
  if (!org) return null;

  const [blocksRes, offersRes] = await Promise.all([
    admin
      .from("site_content")
      .select("*")
      .eq("org_id", org.id)
      .eq("published", true)
      .order("position", { ascending: true }),
    admin
      .from("offers")
      .select("*")
      .eq("org_id", org.id)
      .eq("active", true)
      .order("created_at", { ascending: false }),
  ]);

  return {
    org,
    blocks: blocksRes.data ?? [],
    offers: offersRes.data ?? [],
  };
}

/** Coordonnées de notification d'une org (pour Brevo). Admin, scopé par slug. */
export async function getOrgNotify(slug: string): Promise<{
  name: string;
  contact_phone: string | null;
  contact_email: string | null;
} | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .select("name, contact_phone, contact_email")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getOrgNotify: ${error.message}`);
  return data ?? null;
}
