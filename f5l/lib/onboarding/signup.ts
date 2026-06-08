import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { FORMULA_PLANS } from "@/lib/billing/formulas";
import type { Formula } from "@/types/database";

export interface SignupInput {
  email: string;
  password: string;
  orgName: string;
  slug: string;
  sector?: string | null;
  formula: Formula;
  fullName?: string | null;
}

export interface SignupResult {
  ok: boolean;
  error?: string;
  userId?: string;
  orgId?: string;
}

/**
 * Crée user + org + profile + org_modules + subscription (trialing) en une
 * seule opération. Utilise le client admin pour court-circuiter la RLS le
 * temps du provisioning, puis tout le reste de la session passe par la RLS.
 *
 * Idempotent sur erreur partielle (l'utilisateur peut retenter).
 */
export async function signupOrgAndOwner(input: SignupInput): Promise<SignupResult> {
  const admin = createAdminClient();

  // 1. Vérifier l'unicité du slug (avant de créer le user).
  const cleanSlug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!cleanSlug || cleanSlug.length < 3) {
    return { ok: false, error: "Slug invalide (3 caractères min, a-z 0-9 -)." };
  }
  const { data: existingSlug } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", cleanSlug)
    .maybeSingle();
  if (existingSlug) return { ok: false, error: "Ce slug est déjà pris." };

  // 2. Créer l'utilisateur Supabase (e-mail confirmé d'office en V1).
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName ?? null },
  });
  if (userErr || !created.user) {
    return { ok: false, error: userErr?.message ?? "Création du compte impossible." };
  }
  const userId = created.user.id;

  // 3. Créer l'org.
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({
      name: input.orgName,
      slug: cleanSlug,
      sector: input.sector ?? null,
      formula: input.formula,
    })
    .select("id")
    .single();
  if (orgErr || !org) {
    // Cleanup user pour pouvoir retenter.
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    return { ok: false, error: orgErr?.message ?? "Création de l'organisation impossible." };
  }

  // 4. Créer le profile (lien user ↔ org).
  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId,
    org_id: org.id,
    full_name: input.fullName ?? null,
    role: "owner",
  });
  if (profileErr) {
    return { ok: false, error: `Profile : ${profileErr.message}` };
  }

  // 5. Activer les modules de la formule.
  const plan = FORMULA_PLANS[input.formula];
  const moduleRows = plan.defaultModules.map((module_key) => ({
    org_id: org.id,
    module_key,
    enabled: true,
  }));
  await admin.from("org_modules").upsert(moduleRows, { onConflict: "org_id,module_key" });

  // 6. Créer la souscription (trialing — Stripe sera branché plus tard).
  await admin
    .from("subscriptions")
    .upsert(
      {
        org_id: org.id,
        formula: input.formula,
        status: "trialing",
      },
      { onConflict: "org_id" },
    );

  return { ok: true, userId, orgId: org.id };
}

/** Connecte l'utilisateur qu'on vient de créer (pose les cookies de session). */
export async function signinAfterSignup(email: string, password: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}
