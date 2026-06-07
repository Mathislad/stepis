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
    label: "Acquisition Starter",
    priceMonthlyEur: 99,
    description: "Le socle pour capter vos premiers prospects : page, formulaires et suivi.",
    defaultModules: ["site", "crm", "lead_capture", "acquisition"],
    highlightedModules: ["site", "lead_capture", "crm", "acquisition"],
  },
  business: {
    key: "business",
    label: "Acquisition Business",
    priceMonthlyEur: 299,
    description: "Pour piloter vos campagnes locales et suivre le coût par prospect.",
    defaultModules: ["site", "crm", "lead_capture", "acquisition"],
    highlightedModules: ["acquisition", "lead_capture", "crm", "site"],
  },
  full: {
    key: "full",
    label: "Acquisition Full",
    priceMonthlyEur: 599,
    description: "Pour scaler : acquisition multi-canal, reporting et accompagnement avancé.",
    defaultModules: ["site", "crm", "lead_capture", "acquisition"],
    highlightedModules: ["acquisition", "lead_capture", "crm", "site"],
  },
};

export const FORMULA_ORDER: Formula[] = ["starter", "business", "full"];

export function planFor(formula: Formula): FormulaPlan {
  return FORMULA_PLANS[formula];
}
