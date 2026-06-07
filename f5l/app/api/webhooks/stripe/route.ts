import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint webhook Stripe (stub).
 * Tant que `STRIPE_WEBHOOK_SECRET` n'est pas défini, on accuse simplement
 * réception (200) sans rien traiter — Stripe arrêtera de réessayer.
 *
 * Pour activer le vrai webhook : brancher le SDK Stripe, vérifier la
 * signature, puis selon `event.type` :
 *  - `checkout.session.completed` → applyFormulaChange + stocker stripe_*_id
 *  - `customer.subscription.updated` → mettre à jour status / current_period_end
 *  - `customer.subscription.deleted` → status = 'canceled'
 *
 * La logique métier vit dans lib/settings/subscription.ts (applyFormulaChange).
 */
export async function POST(_request: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { ok: true, message: "Stripe webhook stub — non configuré." },
      { status: 200 },
    );
  }
  // TODO: vraie vérification de signature + dispatch.
  return NextResponse.json({ ok: true });
}
