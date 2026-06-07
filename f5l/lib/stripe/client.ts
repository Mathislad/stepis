import "server-only";
import type { Formula } from "@/types/database";

/**
 * Stub Stripe. Tant que `STRIPE_SECRET_KEY` est absente, toutes les fonctions
 * retournent `{ configured: false }`. À brancher : remplacer les corps par
 * des appels au SDK Stripe officiel.
 *
 * DECISION: aucune dépendance NPM ajoutée ici (le SDK Stripe est ajouté
 * quand on branche réellement). Le stub fait foi tant que la clé manque.
 */
export interface StripeResult {
  configured: boolean;
  message: string;
  checkoutUrl?: string;
  portalUrl?: string;
}

export async function createCheckoutSession(_params: {
  orgId: string;
  formula: Formula;
  successUrl: string;
  cancelUrl: string;
}): Promise<StripeResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { configured: false, message: "Stripe non configuré (clé manquante)." };
  }
  return {
    configured: false,
    message: "Intégration Stripe Checkout à finaliser.",
  };
}

export async function createBillingPortalSession(_params: {
  customerId: string;
  returnUrl: string;
}): Promise<StripeResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { configured: false, message: "Stripe non configuré." };
  }
  return { configured: false, message: "Portail client Stripe à finaliser." };
}

export async function cancelSubscription(_subscriptionId: string): Promise<StripeResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { configured: false, message: "Stripe non configuré." };
  }
  return { configured: false, message: "Annulation Stripe à finaliser." };
}

export function stripeStatus(): { configured: boolean; message: string } {
  return process.env.STRIPE_SECRET_KEY
    ? { configured: true, message: "Stripe configuré." }
    : { configured: false, message: "Stripe non configuré." };
}
