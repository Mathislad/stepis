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
  { key: "site",          label: "Site éditable",        description: "CMS-lite : offres, images, prix, textes.",        minFormula: "starter",  available: true },
  { key: "crm",           label: "CRM",                  description: "Contacts B2B / B2C et journal d'activité.",       minFormula: "starter",  available: true },
  { key: "lead_capture",  label: "Capture de leads",     description: "Formulaires du site → leads → contacts.",         minFormula: "starter",  available: true },
  { key: "loyalty_agent", label: "Agent Fidélisation",   description: "Séquences déclenchées (anniversaire, inactivité).", minFormula: "business", available: true },
  { key: "loyalty_card",  label: "Carte de fidélité",    description: "Points, paliers, scans QR.",                       minFormula: "business", available: true },
  { key: "reputation",    label: "Réputation",           description: "Avis et e-réputation.",                            minFormula: "full",     available: false },
  { key: "phone",         label: "Téléphone",            description: "Réponse téléphonique IA.",                         minFormula: "full",     available: false },
  { key: "acquisition",   label: "Acquisition",          description: "Génération de nouveaux clients.",                  minFormula: "full",     available: false },
  { key: "admin",         label: "Administratif",        description: "Gestion administrative.",                          minFormula: "full",     available: false },
  { key: "manager",       label: "Manager",              description: "Résumé quotidien et coordination des agents.",     minFormula: "full",     available: false },
];

export const MODULE_BY_KEY: Record<ModuleKey, ModuleMeta> = Object.fromEntries(
  MODULE_LIST.map((m) => [m.key, m]),
) as Record<ModuleKey, ModuleMeta>;
