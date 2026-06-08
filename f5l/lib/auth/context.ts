import { createClient } from "@/lib/supabase/server";
import type {
  Formula,
  ModuleKey,
  OrgModuleRow,
  OrganizationRow,
  ProfileRow,
} from "@/types/database";

/** Contexte tenant résolu pour l'utilisateur courant. */
export interface OrgContext {
  userId: string;
  email: string | null;
  profile: ProfileRow;
  org: OrganizationRow;
  formula: Formula;
  modules: OrgModuleRow[];
  /** Clés des modules effectivement activés pour l'org. */
  enabledModules: Set<ModuleKey>;
}

/**
 * Retourne l'org + la formule + les modules de l'utilisateur connecté.
 * `null` si aucun utilisateur (ou profil/org introuvable).
 *
 * Toutes les requêtes passent par le client serveur (RLS active) : on ne lit
 * donc que les données du tenant de l'utilisateur, par construction.
 */
export async function getOrgContext(): Promise<OrgContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  const [{ data: org }, { data: modules }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", profile.org_id).single(),
    supabase.from("org_modules").select("*").eq("org_id", profile.org_id),
  ]);
  if (!org) return null;

  const moduleRows = modules ?? [];

  return {
    userId: user.id,
    email: user.email ?? null,
    profile,
    org,
    formula: org.formula,
    modules: moduleRows,
    enabledModules: new Set(
      moduleRows.filter((m) => m.enabled).map((m) => m.module_key),
    ),
  };
}

/**
 * Renvoie l'`org_id` de l'utilisateur courant (via la RPC `current_org_id`,
 * un seul aller-retour). Source de vérité serveur pour fixer `org_id` lors des
 * écritures — jamais une valeur venant du client. `null` si pas de session.
 */
export async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("current_org_id");
  if (error) return null;
  return data ?? null;
}
