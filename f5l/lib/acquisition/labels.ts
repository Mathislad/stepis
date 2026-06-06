import type { AdCampaignStatus, AdObjective, AdPlatform } from "@/types/database";
import type { BadgeTone } from "@/components/ui/Badge";

export const OBJECTIVE_LABELS: Record<AdObjective, string> = {
  visibility: "Notoriété",
  leads: "Demandes de contact",
  promo: "Promotion",
};

export const PLATFORM_LABELS: Record<AdPlatform, string> = {
  meta: "Meta (Facebook/Instagram)",
  google: "Google",
  both: "Meta + Google",
};

export const STATUS_LABELS: Record<AdCampaignStatus, string> = {
  draft: "Brouillon",
  active: "Active",
  paused: "En pause",
  completed: "Terminée",
};

export const STATUS_TONES: Record<AdCampaignStatus, BadgeTone> = {
  draft: "neutral",
  active: "green",
  paused: "amber",
  completed: "blue",
};
