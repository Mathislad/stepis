import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { requireEnv } from "@/lib/env";

/**
 * Client Supabase côté serveur (Server Components, Route Handlers, Server
 * Actions). Utilise la clé ANON + les cookies de session : la RLS s'applique
 * donc avec l'identité de l'utilisateur connecté (isolation par org garantie).
 *
 * Ne JAMAIS utiliser pour contourner la RLS — pour ça, voir `admin.ts`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Appelé depuis un Server Component (cookies en lecture seule) :
            // sans effet ici car le middleware rafraîchit déjà la session.
          }
        },
      },
    },
  );
}
