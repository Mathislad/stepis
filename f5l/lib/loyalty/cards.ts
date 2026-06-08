import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrgId } from "@/lib/auth/context";
import type {
  LoyaltyCardRow,
  LoyaltyReason,
  LoyaltyRewardRow,
  LoyaltyTransactionRow,
} from "@/types/database";

export const CARDS_PAGE_SIZE = 20;

export interface CardContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}
export interface CardWithContact extends LoyaltyCardRow {
  contact: CardContact | null;
}
export interface CardListResult {
  rows: CardWithContact[];
  total: number;
  page: number;
  pageCount: number;
}

/**
 * Liste paginée des cartes du tenant (RLS auto-scope). Recherche par nom/email/
 * téléphone du contact : on résout d'abord les contacts, puis les cartes — pas
 * de `select` imbriqué (les `Relationships` du type sont vides).
 */
export async function listCards(
  filters: { search?: string; page?: number } = {},
): Promise<CardListResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * CARDS_PAGE_SIZE;
  const to = from + CARDS_PAGE_SIZE - 1;

  let cardQuery = supabase
    .from("loyalty_cards")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false });

  const term = filters.search?.trim();
  if (term) {
    const safe = term.replace(/[%,()*]/g, " ");
    const { data: matched, error: mErr } = await supabase
      .from("contacts")
      .select("id")
      .or(`name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`);
    if (mErr) throw new Error(`listCards(search): ${mErr.message}`);
    const ids = (matched ?? []).map((c) => c.id);
    if (ids.length === 0) return { rows: [], total: 0, page, pageCount: 1 };
    cardQuery = cardQuery.in("contact_id", ids);
  }

  const { data: cards, count, error } = await cardQuery.range(from, to);
  if (error) throw new Error(`listCards: ${error.message}`);
  const cardRows = cards ?? [];

  const contactIds = [...new Set(cardRows.map((c) => c.contact_id))];
  const byId = new Map<string, CardContact>();
  if (contactIds.length > 0) {
    const { data: contacts, error: cErr } = await supabase
      .from("contacts")
      .select("id, name, phone, email")
      .in("id", contactIds);
    if (cErr) throw new Error(`listCards(contacts): ${cErr.message}`);
    for (const c of contacts ?? []) byId.set(c.id, c);
  }

  const rows: CardWithContact[] = cardRows.map((c) => ({
    ...c,
    contact: byId.get(c.contact_id) ?? null,
  }));
  const total = count ?? 0;
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / CARDS_PAGE_SIZE)) };
}

export async function getCard(id: string): Promise<CardWithContact | null> {
  const supabase = await createClient();
  const { data: card, error } = await supabase
    .from("loyalty_cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getCard: ${error.message}`);
  if (!card) return null;

  const { data: contact } = await supabase
    .from("contacts")
    .select("id, name, phone, email")
    .eq("id", card.contact_id)
    .maybeSingle();
  return { ...card, contact: contact ?? null };
}

/** Contacts sans carte (éligibles à la création d'une nouvelle carte). */
export async function listEligibleContacts(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const [{ data: cards }, { data: contacts }] = await Promise.all([
    supabase.from("loyalty_cards").select("contact_id"),
    supabase.from("contacts").select("id, name").order("name", { ascending: true }),
  ]);
  const taken = new Set((cards ?? []).map((c) => c.contact_id));
  return (contacts ?? []).filter((c) => !taken.has(c.id));
}

/**
 * Crée une carte pour un contact. `org_id` serveur, `card_token` = défaut DB
 * (hex). Une seule carte par contact (unicité applicative).
 */
export async function createCard(contactId: string): Promise<LoyaltyCardRow> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("createCard: organisation introuvable.");

  const { data: existing } = await supabase
    .from("loyalty_cards")
    .select("id")
    .eq("contact_id", contactId)
    .limit(1);
  if (existing && existing.length > 0) throw new Error("CARD_EXISTS");

  const { data, error } = await supabase
    .from("loyalty_cards")
    .insert({ org_id: orgId, contact_id: contactId })
    .select("*")
    .single();
  if (error) throw new Error(`createCard: ${error.message}`);
  return data;
}

/**
 * Crédite/débite des points (2 écritures — échelle TPE). Met à jour le solde
 * puis journalise la transaction. Refuse un solde négatif.
 * Limite connue : non transactionnel (une panne entre les 2 écritures laisse
 * une incohérence ; acceptable au MVP, une RPC 0004 le rendrait atomique).
 */
export async function addPoints(
  cardId: string,
  delta: number,
  reason: LoyaltyReason,
): Promise<void> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("addPoints: organisation introuvable.");

  const { data: card, error: cErr } = await supabase
    .from("loyalty_cards")
    .select("id, points")
    .eq("id", cardId)
    .maybeSingle();
  if (cErr) throw new Error(`addPoints: ${cErr.message}`);
  if (!card) throw new Error("CARD_NOT_FOUND");

  const newPoints = card.points + delta;
  if (newPoints < 0) throw new Error("INSUFFICIENT_POINTS");

  const { error: uErr } = await supabase
    .from("loyalty_cards")
    .update({ points: newPoints })
    .eq("id", cardId);
  if (uErr) throw new Error(`addPoints(update): ${uErr.message}`);

  const { error: tErr } = await supabase
    .from("loyalty_transactions")
    .insert({ org_id: orgId, card_id: cardId, delta_points: delta, reason });
  if (tErr) {
    console.error("[addPoints] transaction non journalisée:", tErr.message);
  }
}

/** Transactions d'une carte (org-scopé par RLS), plus récentes d'abord. */
export async function listCardTransactions(
  cardId: string,
): Promise<LoyaltyTransactionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("*")
    .eq("card_id", cardId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listCardTransactions: ${error.message}`);
  return data ?? [];
}

// ── Côté public (anon) : client ADMIN scopé par token ───────────────────────
export interface PublicCardData {
  card: LoyaltyCardRow;
  org: { name: string };
  rewards: LoyaltyRewardRow[];
  transactions: LoyaltyTransactionRow[];
}

/**
 * Données de la carte publique (client final, sans login). Client admin (anon
 * ne passe pas la RLS), strictement scopé à la carte du token et à son org.
 * `null` si token inconnu.
 */
export async function getPublicCard(token: string): Promise<PublicCardData | null> {
  const admin = createAdminClient();

  const { data: card, error } = await admin
    .from("loyalty_cards")
    .select("*")
    .eq("card_token", token)
    .maybeSingle();
  if (error) throw new Error(`getPublicCard: ${error.message}`);
  if (!card) return null;

  const [orgRes, rewardsRes, txRes] = await Promise.all([
    admin.from("organizations").select("name").eq("id", card.org_id).maybeSingle(),
    admin
      .from("loyalty_rewards")
      .select("*")
      .eq("org_id", card.org_id)
      .eq("active", true)
      .order("points_required", { ascending: true }),
    admin
      .from("loyalty_transactions")
      .select("*")
      .eq("card_id", card.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    card,
    org: { name: orgRes.data?.name ?? "" },
    rewards: rewardsRes.data ?? [],
    transactions: txRes.data ?? [],
  };
}
