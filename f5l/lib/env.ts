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
