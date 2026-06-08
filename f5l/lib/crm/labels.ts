import type { BadgeTone } from "@/components/ui/Badge";
import type {
  ActivityType,
  ContactSource,
  ContactType,
  LeadStatus,
  PipelineStatus,
} from "@/types/database";

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  b2b: "Professionnel",
  b2c: "Particulier",
};

export const CONTACT_SOURCE_LABELS: Record<ContactSource, string> = {
  f5l_acquisition: "Amené par F5L",
  manual: "Manuel",
  site_form: "Formulaire site",
  loyalty: "Fidélité",
  other: "Autre",
};

export const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  lead: "Lead",
  qualified: "Qualifié",
  proposal: "Proposition",
  won: "Gagné",
  lost: "Perdu",
};

export const PIPELINE_TONES: Record<PipelineStatus, BadgeTone> = {
  lead: "neutral",
  qualified: "blue",
  proposal: "violet",
  won: "green",
  lost: "red",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  converted: "Converti",
  archived: "Archivé",
};

export const LEAD_STATUS_TONES: Record<LeadStatus, BadgeTone> = {
  new: "blue",
  contacted: "amber",
  converted: "green",
  archived: "neutral",
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  call: "Appel",
  email: "E-mail",
  sms: "SMS",
  note: "Note",
  quote: "Devis",
  visit: "Visite",
};

export const ACTIVITY_GLYPHS: Record<ActivityType, string> = {
  call: "📞",
  email: "✉️",
  sms: "💬",
  note: "📝",
  quote: "📄",
  visit: "📍",
};

export const SOURCE_TONES: Record<ContactSource, BadgeTone> = {
  f5l_acquisition: "blue",
  manual: "neutral",
  site_form: "violet",
  loyalty: "green",
  other: "neutral",
};
