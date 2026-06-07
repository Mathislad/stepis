import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/auth/context";
import { FORMULA_PLANS } from "@/lib/billing/formulas";
import type { Formula, SubscriptionRow } from "@/types/database";

export async function getMySubscription(): Promise<SubscriptionRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .maybeSingle();
  if (error) throw new Error(`getMySubscription: ${error.message}`);
  return data ?? null;
}

/**
 * Met à niveau / rétrograde la formule de l'org. Réécrit les `org_modules`
 * pour correspondre à la nouvelle formule, sans toucher aux modules
 * additionnels explicitement activés.
 *
 * NOTE: Stripe n'est pas appelé ici — le webhook Stripe (à brancher plus
 * tard) appellera cette fonction côté serveur après une mutation.
 */
export async function applyFormulaChange(formula: Formula): Promise<void> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("Organisation introuvable.");

  // 1. Met à jour la formule sur l'org + la souscription.
  await supabase.from("organizations").update({ formula }).eq("id", orgId);
  await supabase
    .from("subscriptions")
    .upsert({ org_id: orgId, formula, status: "active" }, { onConflict: "org_id" });

  // 2. Active tous les modules par défaut de la nouvelle formule.
  const plan = FORMULA_PLANS[formula];
  const rows = plan.defaultModules.map((module_key) => ({
    org_id: orgId,
    module_key,
    enabled: true,
  }));
  await supabase.from("org_modules").upsert(rows, { onConflict: "org_id,module_key" });
}
