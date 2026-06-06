"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireModule } from "@/lib/auth/require-module";
import { addPoints, createCard, getCard } from "@/lib/loyalty/cards";
import {
  createReward,
  deleteReward,
  toggleReward,
  updateReward,
} from "@/lib/loyalty/rewards";
import { getCardUrl } from "@/lib/loyalty/qr";
import { sendLoyaltyCardLink } from "@/lib/brevo/notify";
import type { LoyaltyReason } from "@/types/database";

export interface LoyaltyFormState {
  ok: boolean;
  error: string | null;
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function intOf(fd: FormData, key: string): number {
  return Number.parseInt(str(fd, key), 10);
}

const REASONS: LoyaltyReason[] = ["earn", "redeem", "adjust"];

// ── Cartes ────────────────────────────────────────────────────────────────--
export async function createCardAction(
  _prev: LoyaltyFormState,
  fd: FormData,
): Promise<LoyaltyFormState> {
  await requireModule("loyalty_card");
  const contactId = str(fd, "contactId");
  if (!contactId) return { ok: false, error: "Sélectionnez un contact." };

  let cardId: string;
  try {
    const card = await createCard(contactId);
    cardId = card.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "CARD_EXISTS") return { ok: false, error: "Ce contact a déjà une carte." };
    return { ok: false, error: "Création impossible." };
  }
  revalidatePath("/loyalty");
  redirect(`/loyalty/${cardId}`);
}

export async function addPointsAction(
  _prev: LoyaltyFormState,
  fd: FormData,
): Promise<LoyaltyFormState> {
  await requireModule("loyalty_card");
  const cardId = str(fd, "cardId");
  const amount = intOf(fd, "amount");
  const reason = str(fd, "reason") as LoyaltyReason;

  if (!cardId) return { ok: false, error: "Carte introuvable." };
  if (!REASONS.includes(reason)) return { ok: false, error: "Raison invalide." };
  if (!Number.isFinite(amount) || amount === 0) {
    return { ok: false, error: "Saisissez un nombre de points." };
  }

  // `earn` ajoute, `redeem` retire, `adjust` applique la valeur telle quelle.
  const delta =
    reason === "redeem"
      ? -Math.abs(amount)
      : reason === "earn"
        ? Math.abs(amount)
        : amount;

  try {
    await addPoints(cardId, delta, reason);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INSUFFICIENT_POINTS") {
      return { ok: false, error: "Solde insuffisant pour ce retrait." };
    }
    return { ok: false, error: "Opération impossible." };
  }
  revalidatePath("/loyalty");
  revalidatePath(`/loyalty/${cardId}`);
  return { ok: true, error: null };
}

export async function sendCardLinkAction(
  _prev: LoyaltyFormState,
  fd: FormData,
): Promise<LoyaltyFormState> {
  const ctx = await requireModule("loyalty_card");
  const cardId = str(fd, "cardId");
  if (!cardId) return { ok: false, error: "Carte introuvable." };

  const card = await getCard(cardId);
  if (!card) return { ok: false, error: "Carte introuvable." };

  // Coordonnées absentes → message clair (le helper Brevo gère aussi ce cas).
  if (!card.contact?.phone && !card.contact?.email) {
    return { ok: false, error: "Ce contact n'a ni téléphone ni e-mail." };
  }

  try {
    await sendLoyaltyCardLink({
      orgName: ctx.org.name,
      contact: {
        name: card.contact?.name ?? null,
        phone: card.contact?.phone ?? null,
        email: card.contact?.email ?? null,
      },
      url: getCardUrl(card.card_token),
    });
  } catch (e) {
    console.error("[sendCardLink]", e);
    return { ok: false, error: "Envoi impossible." };
  }
  return { ok: true, error: null };
}

// ── Paliers de récompense ───────────────────────────────────────────────────
export async function saveRewardAction(
  _prev: LoyaltyFormState,
  fd: FormData,
): Promise<LoyaltyFormState> {
  await requireModule("loyalty_card");
  const id = str(fd, "rewardId");
  const label = str(fd, "label");
  const points = intOf(fd, "points_required");
  const active = fd.get("active") === "on";

  if (!label) return { ok: false, error: "Le libellé est requis." };
  if (!Number.isFinite(points) || points <= 0) {
    return { ok: false, error: "Indiquez un nombre de points valide." };
  }

  try {
    if (id) await updateReward(id, { label, points_required: points, active });
    else await createReward({ label, points_required: points, active });
  } catch {
    return { ok: false, error: "Enregistrement impossible." };
  }
  revalidatePath("/loyalty/rewards");
  revalidatePath("/loyalty");
  redirect("/loyalty/rewards");
}

export async function deleteRewardAction(fd: FormData): Promise<void> {
  await requireModule("loyalty_card");
  const id = str(fd, "rewardId");
  if (id) {
    try {
      await deleteReward(id);
    } catch {
      /* best-effort */
    }
  }
  revalidatePath("/loyalty/rewards");
  revalidatePath("/loyalty");
}

export async function toggleRewardAction(fd: FormData): Promise<void> {
  await requireModule("loyalty_card");
  const id = str(fd, "rewardId");
  const active = str(fd, "active") === "true";
  if (id) {
    try {
      await toggleReward(id, active);
    } catch {
      /* best-effort */
    }
  }
  revalidatePath("/loyalty/rewards");
  revalidatePath("/loyalty");
}
