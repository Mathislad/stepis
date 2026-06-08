import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { requireEnv } from "@/lib/env";

/**
 * Client SERVICE ROLE : contourne la RLS. À n'utiliser QUE côté serveur, pour
 * des opérations privilégiées contrôlées (provisioning d'un tenant, webhooks
 * Brevo/Anthropic, écriture de metering). Ne jamais l'exposer au navigateur.
 *
 * Comme tout passe par `org_id`, ces opérations doivent rester strictement
 * scopées à l'org concernée dans le code appelant.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
