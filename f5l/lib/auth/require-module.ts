import { redirect } from "next/navigation";
import { getOrgContext, type OrgContext } from "@/lib/auth/context";
import type { ModuleKey } from "@/types/database";

/**
 * Garde de page : impose un utilisateur connecté.
 * Redirige vers /login sinon. À appeler en tête d'un Server Component protégé.
 */
export async function requireAuth(): Promise<OrgContext> {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  return ctx;
}

/**
 * Garde de module : impose que `moduleKey` soit activé pour l'org.
 * - pas connecté        → /login
 * - module non activé   → /locked?module=<key>
 *
 * Les pages des futurs modules commenceront toutes par :
 *   const ctx = await requireModule("crm");
 */
export async function requireModule(moduleKey: ModuleKey): Promise<OrgContext> {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  if (!ctx.enabledModules.has(moduleKey)) {
    redirect(`/locked?module=${encodeURIComponent(moduleKey)}`);
  }
  return ctx;
}
