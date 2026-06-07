import { requireAuth } from "@/lib/auth/require-module";
import { getMySubscription } from "@/lib/settings/subscription";
import { stripeStatus } from "@/lib/stripe/client";
import { FORMULA_PLANS, FORMULA_ORDER } from "@/lib/billing/formulas";
import { BillingActions } from "@/components/settings/BillingActions";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Réglages — Abonnement" };

const STATUS_LABELS: Record<string, string> = {
  trialing: "Essai gratuit",
  active: "Abonnement actif",
  past_due: "Paiement en retard",
  canceled: "Annulé",
  incomplete: "Incomplet",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await requireAuth();
  const sub = await getMySubscription();
  const stripe = stripeStatus();
  const sp = await searchParams;
  const currentPlan = FORMULA_PLANS[ctx.org.formula];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      {sp.status === "success" && (
        <p className="surface px-4 py-3 text-sm" style={{ color: "var(--green)" }}>
          Souscription mise à jour ✓
        </p>
      )}
      {sp.status === "cancel" && (
        <p className="surface px-4 py-3 text-sm" style={{ color: "var(--amber)" }}>
          Vous avez annulé le paiement. Aucune modification appliquée.
        </p>
      )}

      <section className="surface p-5">
        <p className="text-[12px] uppercase tracking-wider text-[var(--muted)]">Formule actuelle</p>
        <div className="mt-1 flex items-baseline gap-3">
          <h2 className="text-2xl font-semibold">{currentPlan.label}</h2>
          <span className="text-sm text-[var(--text-2)]">
            {currentPlan.priceMonthlyEur} € / mois
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Badge tone={sub?.status === "active" ? "green" : "violet"}>
            {STATUS_LABELS[sub?.status ?? "trialing"]}
          </Badge>
          {sub?.current_period_end && (
            <span className="text-[12px] text-[var(--text-2)]">
              Renouvellement le {formatDate(sub.current_period_end)}
            </span>
          )}
        </div>
        {!stripe.configured && (
          <p
            className="mt-3 rounded-md border border-[var(--amber)] bg-[rgba(255,159,10,0.05)] px-3 py-2 text-[12px]"
            style={{ color: "var(--amber)" }}
          >
            ⚠ Stripe n&apos;est pas branché. Les changements de formule sont appliqués en mode démo
            (pas de paiement réel).
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--text-2)]">Toutes les formules</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {FORMULA_ORDER.map((k) => {
            const plan = FORMULA_PLANS[k];
            const isCurrent = k === ctx.org.formula;
            return (
              <div
                key={k}
                className="surface flex flex-col gap-3 p-5"
                style={isCurrent ? { borderColor: "var(--blue)" } : undefined}
              >
                <div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold">{plan.label}</h3>
                    {isCurrent && <Badge tone="blue">En cours</Badge>}
                  </div>
                  <p className="mt-0.5 text-[24px] font-semibold tabular-nums">
                    {plan.priceMonthlyEur} €
                    <span className="text-[13px] font-normal text-[var(--text-2)]"> /mois</span>
                  </p>
                  <p className="mt-2 text-[13px] text-[var(--text-2)]">{plan.description}</p>
                </div>
                <ul className="flex flex-col gap-1 text-[13px]">
                  {plan.highlightedModules.map((m) => (
                    <li key={m} className="flex items-center gap-2 text-[var(--text-2)]">
                      <span style={{ color: "var(--green)" }}>✓</span>
                      <span className="capitalize">{m.replace(/_/g, " ")}</span>
                    </li>
                  ))}
                </ul>
                {!isCurrent && <BillingActions formula={k} />}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
