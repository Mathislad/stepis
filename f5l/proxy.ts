import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Convention « proxy » de Next 16 (remplace `middleware`).
 * Rafraîchit la session Supabase + protège les routes à chaque requête.
 */
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Exécute sur toutes les routes SAUF les assets statiques
   * (refresh de session + protection des routes).
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
