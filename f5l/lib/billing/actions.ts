"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/require-module";
import { getCurrentOrgId } from "@/lib/auth/context";
import {
  cancelSubscription,
  createBillingPortalSession,
  createCheckoutSession,
} from "@/lib/stripe/client";
import { applyFormulaChange } from "@/lib/settings/subscription";
import { getMySubscription } from "@/lib/settings/subscription";
import { FORMULA_ORDER } from "@/lib/billing/formulas";
import type { Formula } from "@/types/database";
import { redirect } from "next/navigation";

export interface BillingFormState {
  ok: boolean;
  error: string | null;
  message?: string | null;
  redirectTo?: string | null;
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Démarre un Stripe Checkout pour la formule cible.
 * Si Stripe n'est pas configuré, applique directement le changement de formule
 * en mode « trialing » (utile pour le développement / la démo).
 */
export async function startCheckoutAction(
  _prev: BillingFormState,
  fd: FormData,
): Promise<BillingFormState> {
  await requireAuth();
  const formula = str(fd, "formula") as Formula;
  if (!FORMULA_ORDER.includes(formula)) return { ok: false, error: "Formule invalide." };

  const orgId = await getCurrentOrgId();
  if (!orgId) return { ok: false, error: "Organisation introuvable." };

  const result = await createCheckoutSession({
    orgId,
    formula,
    successUrl: `${baseUrl()}/settings/billing?status=success`,
    cancelUrl: `${baseUrl()}/settings/billing?status=cancel`,
  });

  if (result.configured && result.checkoutUrl) {
    redirect(result.checkoutUrl);
  }

  // Stripe absent → on applique le changement en mode démo (utile en dev).
  await applyFormulaChange(formula);
  revalidatePath("/settings/billing");
  revalidatePath("/", "layout");
  return {
    ok: true,
    error: null,
    message:
      "Stripe n'est pas branché — formule appliquée en mode démo. À brancher pour la facturation réelle.",
  };
}

export async function openBillingPortalAction(): Promise<BillingFormState> {
  await requireAuth();
  const sub = await getMySubscription();
  if (!sub?.stripe_customer_id) {
    return { ok: false, error: "Aucun client Stripe associé (formule en démo)." };
  }
  const result = await createBillingPortalSession({
    customerId: sub.stripe_customer_id,
    returnUrl: `${baseUrl()}/settings/billing`,
  });
  if (result.configured && result.portalUrl) {
    redirect(result.portalUrl);
  }
  return { ok: false, error: result.message };
}

export async function cancelSubscriptionAction(): Promise<BillingFormState> {
  await requireAuth();
  const sub = await getMySubscription();
  if (!sub?.stripe_subscription_id) {
    return { ok: false, error: "Aucune souscription Stripe active." };
  }
  await cancelSubscription(sub.stripe_subscription_id);
  revalidatePath("/settings/billing");
  return { ok: true, error: null, message: "Annulation programmée." };
}
