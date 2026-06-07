import type { Formula, ModuleKey } from "@/types/database";

export interface FormulaPlan {
  key: Formula;
  label: string;
  priceMonthlyEur: number;
  description: string;
  /** Modules activés par défaut pour cette formule. */
  defaultModules: ModuleKey[];
  /** Modules disponibles à la souscription (visible dans le marketing). */
  highlightedModules: ModuleKey[];
}

/**
 * Source de vérité des formules F5L. Les modules réellement activés vivent
 * dans `org_modules` (table), mais à la création d'une org on les pré-active
 * ici. À la mise à niveau, on aligne `org_modules` sur le plan.
 */
export const FORMULA_PLANS: Record<Formula, FormulaPlan> = {
  starter: {
    key: "starter",
    label: "Starter",
    priceMonthlyEur: 99,
    description: "Pour commencer : votre site, vos clients, vos demandes de contact.",
    defaultModules: ["site", "crm", "lead_capture"],
    highlightedModules: ["site", "crm", "lead_capture"],
  },
  business: {
    key: "business",
    label: "Business",
    priceMonthlyEur: 299,
    description: "Plus de fidélisation et un Manager qui résume votre journée.",
    defaultModules: [
      "site",
      "crm",
      "lead_capture",
      "loyalty_card",
      "loyalty_agent",
      "manager",
    ],
    highlightedModules: ["loyalty_card", "loyalty_agent", "manager"],
  },
  full: {
    key: "full",
    label: "Full",
    priceMonthlyEur: 599,
    description: "L'équipe complète : téléphone, publicité, administratif, réputation.",
    defaultModules: [
      "site",
      "crm",
      "lead_capture",
      "loyalty_card",
      "loyalty_agent",
      "manager",
      "reputation",
      "phone",
      "acquisition",
      "admin",
    ],
    highlightedModules: ["phone", "acquisition", "admin", "reputation"],
  },
};

export const FORMULA_ORDER: Formula[] = ["starter", "business", "full"];

export function planFor(formula: Formula): FormulaPlan {
  return FORMULA_PLANS[formula];
}
