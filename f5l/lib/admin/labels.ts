import type { BadgeTone } from "@/components/ui/Badge";
import type { DocumentStatus, DocumentType } from "@/types/database";

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  devis: "Devis",
  facture: "Facture",
  contrat: "Contrat",
};

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  signed: "Signé",
  paid: "Payé",
  overdue: "En retard",
  cancelled: "Annulé",
};

export const STATUS_TONES: Record<DocumentStatus, BadgeTone> = {
  draft: "neutral",
  sent: "blue",
  signed: "violet",
  paid: "green",
  overdue: "red",
  cancelled: "neutral",
};
