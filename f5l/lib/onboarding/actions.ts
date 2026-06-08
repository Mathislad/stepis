"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signinAfterSignup, signupOrgAndOwner } from "@/lib/onboarding/signup";
import { createClient } from "@/lib/supabase/server";
import { FORMULA_ORDER } from "@/lib/billing/formulas";
import type { Formula } from "@/types/database";

export interface SignupFormState {
  ok: boolean;
  error: string | null;
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export async function signupAction(
  _prev: SignupFormState,
  fd: FormData,
): Promise<SignupFormState> {
  const email = str(fd, "email");
  const password = str(fd, "password");
  const orgName = str(fd, "orgName");
  const slug = str(fd, "slug");
  const sector = str(fd, "sector") || null;
  const fullName = str(fd, "fullName") || null;
  const formula = (str(fd, "formula") || "starter") as Formula;

  if (!email || !password) return { ok: false, error: "E-mail et mot de passe requis." };
  if (password.length < 8) return { ok: false, error: "Mot de passe : 8 caractères min." };
  if (!orgName) return { ok: false, error: "Nom du commerce requis." };
  if (!slug) return { ok: false, error: "Identifiant de site requis." };
  if (!FORMULA_ORDER.includes(formula)) return { ok: false, error: "Formule invalide." };

  const result = await signupOrgAndOwner({
    email,
    password,
    orgName,
    slug,
    sector,
    formula,
    fullName,
  });
  if (!result.ok) return { ok: false, error: result.error ?? "Inscription impossible." };

  // Connecte l'utilisateur (pose les cookies de session) puis redirige sur le dashboard.
  await signinAfterSignup(email, password);
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Accepte une invitation : l'utilisateur arrive sur /accept-invitation/[token]
 * et soumet le formulaire signup-or-login. Si l'e-mail correspond à un compte
 * existant, on log + accepte ; sinon on crée le compte + accepte.
 */
export async function acceptInvitationAction(
  _prev: SignupFormState,
  fd: FormData,
): Promise<SignupFormState> {
  const token = str(fd, "token");
  const password = str(fd, "password");
  const fullName = str(fd, "fullName") || null;
  if (!token) return { ok: false, error: "Lien d'invitation invalide." };
  if (!password) return { ok: false, error: "Mot de passe requis." };

  const supabase = await createClient();
  // 1. Récupère les infos de l'invitation (RPC publique).
  const { data: lookup } = await supabase.rpc("lookup_invitation", { p_token: token });
  const inv = lookup?.[0];
  if (!inv) return { ok: false, error: "Invitation expirée ou déjà utilisée." };

  // 2. Tente la connexion ; si échec → crée le compte.
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: inv.email,
    password,
  });
  if (signInErr) {
    const { error: signUpErr } = await supabase.auth.signUp({
      email: inv.email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (signUpErr) return { ok: false, error: signUpErr.message };
    // Connexion immédiate.
    await supabase.auth.signInWithPassword({ email: inv.email, password });
  }

  // 3. Accepte l'invitation (crée le profile lié à l'org).
  const { error: acceptErr } = await supabase.rpc("accept_invitation", { p_token: token });
  if (acceptErr) return { ok: false, error: "Acceptation impossible." };

  revalidatePath("/", "layout");
  redirect("/");
}
