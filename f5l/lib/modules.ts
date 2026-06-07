import type { Formula, ModuleKey } from "@/types/database";

/**
 * Registre des modules du produit. Source de vérité unique pour l'UI
 * (libellés, ordre, formule minimale indicative). L'activation RÉELLE par org
 * vit dans la table `org_modules` ; ceci n'est que de la métadonnée d'affichage.
 */
export interface ModuleMeta {
  key: ModuleKey;
  label: string;
  description: string;
  /** Formule à partir de laquelle le module est proposé (indicatif). */
  minFormula: Formula;
  /** Disponible dès la V1 du produit, ou prévu plus tard. */
  available: boolean;
}

export const FORMULA_RANK: Record<Formula, number> = {
  starter: 0,
  business: 1,
  full: 2,
};

export const MODULE_LIST: ModuleMeta[] = [
  { key: "site",          label: "Landing pages",        description: "Page locale optimisée pour convertir les visiteurs.", minFormula: "starter", available: true },
  { key: "crm",           label: "Prospects",            description: "Suivi des leads, statuts et relances commerciales.",  minFormula: "starter", available: true },
  { key: "lead_capture",  label: "Capture de leads",     description: "Formulaires, CTA et tracking des demandes.",          minFormula: "starter", available: true },
  { key: "acquisition",   label: "Acquisition Ads",      description: "Campagnes Meta / Google et reporting CPL.",          minFormula: "starter", available: true },
  { key: "loyalty_agent", label: "Fidélisation",         description: "Séquences anniversaire, inactivité et relances.",     minFormula: "business", available: false },
  { key: "loyalty_card",  label: "Carte fidélité",       description: "Points, paliers et QR code client.",                 minFormula: "business", available: false },
  { key: "reputation",    label: "Réputation",           description: "Avis, feedback privé et réponses assistées.",        minFormula: "full",     available: false },
  { key: "phone",         label: "Téléphone IA",         description: "Appels manqués, SMS et agent vocal.",                minFormula: "full",     available: false },
  { key: "admin",         label: "Documents",            description: "Devis, factures, signatures et relances.",           minFormula: "full",     available: false },
  { key: "manager",       label: "Manager IA",           description: "Résumé quotidien et coordination des agents.",       minFormula: "full",     available: false },
];

export const MODULE_BY_KEY: Record<ModuleKey, ModuleMeta> = Object.fromEntries(
  MODULE_LIST.map((m) => [m.key, m]),
) as Record<ModuleKey, ModuleMeta>;
