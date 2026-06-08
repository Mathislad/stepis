import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/auth/context";
import { FORMULA_PLANS } from "@/lib/billing/formulas";
import { MODULE_LIST } from "@/lib/modules";
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
 * pour correspondre à la nouvelle formule. Depuis le pivot F5L Acquisition,
 * les modules hors acquisition restent en "bientôt disponible" et ne sont
 * plus réactivés par inertie lors d'un changement de plan.
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

  // 2. Aligne les modules sur le plan Acquisition.
  const plan = FORMULA_PLANS[formula];
  const enabled = new Set(plan.defaultModules);
  const rows = MODULE_LIST.map(({ key }) => ({
    org_id: orgId,
    module_key: key,
    enabled: enabled.has(key),
  }));
  await supabase.from("org_modules").upsert(rows, { onConflict: "org_id,module_key" });
}
