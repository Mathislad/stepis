import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { requireEnv } from "@/lib/env";

/**
 * Préfixes accessibles SANS authentification :
 *  - /login          : page de connexion
 *  - /auth           : route handlers d'auth (callback, etc.)
 *  - /carte          : consultation publique d'une carte de fidélité (par token)
 *  - /feedback       : feedback privé depuis une demande d'avis
 *  - /p              : site public éditable d'un commerce (par slug)
 *  - /api/cron       : tâches planifiées protégées par secret applicatif
 */
const PUBLIC_PREFIXES = ["/login", "/auth", "/carte", "/feedback", "/p", "/api/cron"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Rafraîchit la session Supabase à chaque requête ET protège les routes.
 * IMPORTANT : ne rien exécuter entre `createServerClient` et `getUser()`,
 * sous peine de déconnexions aléatoires (recommandation officielle Supabase).
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Non connecté + route privée → vers /login
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // Déjà connecté + page de login → vers le tableau de bord
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
