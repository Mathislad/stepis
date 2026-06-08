/** Concatène des classes conditionnelles sans dépendance externe. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Formate un montant en euros (fr-FR). */
export function formatEuro(value: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

/** Date + heure courtes (fr-FR), ex. « 6 juin 2026, 14:30 ». */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Date seule (fr-FR), ex. « 6 juin 2026 ». */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(iso));
}
