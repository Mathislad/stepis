import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { requireEnv } from "@/lib/env";

/**
 * Client Supabase côté navigateur (composants `"use client"`).
 * Clé ANON uniquement — la RLS protège les données.
 */
export function createClient() {
  return createBrowserClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
