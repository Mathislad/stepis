/**
 * Lecture stricte des variables d'environnement.
 * Lève une erreur explicite plutôt que de laisser passer un `undefined`.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[env] Variable d'environnement manquante : ${name}`);
  }
  return value;
}

function isPlaceholder(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    v.length === 0 ||
    v.includes("placeholder") ||
    v.includes("your-") ||
    v.includes("change-me")
  );
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * En dev, l'app doit pouvoir afficher /setup au lieu de crasher si Supabase
 * n'est pas encore configuré. On considère aussi les placeholders comme
 * non configurés pour éviter des appels réseau inutiles.
 */
export function hasSupabaseBrowserEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;
  if (isPlaceholder(url) || isPlaceholder(anonKey)) return false;
  return isValidHttpUrl(url);
}

export function hasSupabaseServiceEnv(): boolean {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return hasSupabaseBrowserEnv() && Boolean(serviceKey && !isPlaceholder(serviceKey));
}
