/**
 * Types de la base F5L — alignés sur `supabase/migrations/0001_foundation.sql`.
 *
 * Maintenus à la main pour l'Étape 1. Quand le schéma se stabilisera, on pourra
 * régénérer ce fichier via `supabase gen types typescript` (cf. README).
 */

// ── Enums (miroir des types Postgres) ───────────────────────────────────────
export type Formula = "starter" | "business" | "full";
export type ProfileRole = "owner" | "staff";
export type ModuleKey =
  | "site"
  | "crm"
  | "lead_capture"
  | "loyalty_agent"
  | "loyalty_card"
  | "reputation"
  | "phone"
  | "acquisition"
  | "admin"
  | "manager";
export type ContactType = "b2b" | "b2c";
export type ContactSource = "f5l_acquisition" | "manual" | "site_form" | "loyalty" | "other";
export type PipelineStatus = "lead" | "qualified" | "proposal" | "won" | "lost";
export type LeadStatus = "new" | "contacted" | "converted" | "archived";
export type ActivityType = "call" | "email" | "sms" | "note" | "quote" | "visit";
export type BlockType = "text" | "image" | "offer" | "price" | "hours";
export type LoyaltyReason = "earn" | "redeem" | "adjust";
export type CampaignTrigger = "birthday" | "inactive" | "post_purchase" | "seasonal";
export type Channel = "sms" | "email" | "whatsapp";
export type UsageMetric = "sms" | "email" | "ai_tokens" | "call_minutes";
export type ReviewRequestStatus = "queued" | "sent" | "opened" | "clicked" | "failed";
export type ReviewSource = "google" | "private" | "manual";
export type ReviewSentiment = "positive" | "neutral" | "negative" | "unknown";
export type ManagerActionStatus =
  | "pending"
  | "approved"
  | "executing"
  | "rejected"
  | "executed"
  | "cancelled";
export type ManagerActionRisk = "low" | "medium" | "high";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ManagerAiSummary = {
  generatedAt: string;
  model: string;
  briefing: string;
  priorities: string[];
  risks: string[];
  opportunities: string[];
  nextActions: string[];
  confidence: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ── Helper : génère Insert à partir du Row ──────────────────────────────────
// Sont optionnelles : les colonnes à défaut DB (`Generated`) ET les colonnes
// nullables (qu'on peut omettre → NULL). Le reste reste requis.
type NullableKeys<T> = { [K in keyof T]-?: null extends T[K] ? K : never }[keyof T];
type WithDefaults<Row, Generated extends keyof Row> = Omit<
  Row,
  Generated | NullableKeys<Row>
> &
  Partial<Pick<Row, Generated | NullableKeys<Row>>>;

// Colonnes générées communes (présentes par défaut côté DB).
type CommonGen = "id" | "created_at";

// ── Rows ─────────────────────────────────────────────────────────────────────
export type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  sector: string | null;
  formula: Formula;
  contact_phone: string | null; // 0003 — notifications Brevo
  contact_email: string | null; // 0003 — notifications Brevo
  created_at: string;
  updated_at: string;
}

export type ProfileRow = {
  id: string; // = auth.users.id
  org_id: string;
  full_name: string | null;
  role: ProfileRole;
  created_at: string;
}

export type OrgModuleRow = {
  id: string;
  org_id: string;
  module_key: ModuleKey;
  enabled: boolean;
  config: Json;
  created_at: string;
  updated_at: string;
}

export type ContactRow = {
  id: string;
  org_id: string;
  type: ContactType;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  source: ContactSource;
  // B2B
  sector: string | null;
  last_contact_at: string | null;
  potential_value: number | null;
  pipeline_status: PipelineStatus | null;
  // B2C
  recurrence: string | null;
  last_visit_at: string | null;
  birthday: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadRow = {
  id: string;
  org_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  source_url: string | null;
  source: ContactSource; // origine du lead (0002) → attribution ROI
  status: LeadStatus;
  created_at: string;
}

export type ActivityRow = {
  id: string;
  org_id: string;
  contact_id: string;
  type: ActivityType;
  content: string | null;
  created_by: string | null;
  created_at: string;
}

export type SiteContentRow = {
  id: string;
  org_id: string;
  block_key: string;
  block_type: BlockType;
  content: Json;
  position: number;
  published: boolean;
  updated_at: string;
}

export type OfferRow = {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  discount: string | null;
  valid_from: string | null;
  valid_until: string | null;
  active: boolean;
  created_at: string;
}

export type LoyaltyCardRow = {
  id: string;
  org_id: string;
  contact_id: string;
  points: number;
  card_token: string;
  created_at: string;
  updated_at: string;
}

export type LoyaltyTransactionRow = {
  id: string;
  org_id: string;
  card_id: string;
  delta_points: number;
  reason: LoyaltyReason;
  created_at: string;
}

export type LoyaltyRewardRow = {
  id: string;
  org_id: string;
  label: string;
  points_required: number;
  active: boolean;
  created_at: string;
}

export type CampaignRow = {
  id: string;
  org_id: string;
  trigger: CampaignTrigger;
  channel: Channel;
  template: Json;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type MessageRow = {
  id: string;
  org_id: string;
  contact_id: string | null;
  campaign_id: string | null;
  dedupe_key: string | null;
  channel: Channel;
  provider_id: string | null;
  status: string | null;
  cost_units: number;
  sent_at: string;
}

export type UsageMeteringRow = {
  id: string;
  org_id: string;
  period: string;
  metric: UsageMetric;
  quantity: number;
  updated_at: string;
}

export type DailyDigestRow = {
  id: string;
  org_id: string;
  digest_date: string;
  summary: Json;
  created_at: string;
}

export type AuditLogRow = {
  id: string;
  org_id: string;
  agent: string;
  action: string;
  payload: Json;
  created_at: string;
}

export type ReviewRequestRow = {
  id: string;
  org_id: string;
  contact_id: string | null;
  channel: Channel;
  status: ReviewRequestStatus;
  request_url: string | null;
  dedupe_key: string | null;
  sent_at: string | null;
  created_at: string;
}

export type ReviewRow = {
  id: string;
  org_id: string;
  contact_id: string | null;
  source: ReviewSource;
  rating: number | null;
  author_name: string | null;
  content: string | null;
  sentiment: ReviewSentiment;
  public_url: string | null;
  response_draft: string | null;
  response_draft_generated_at: string | null;
  response_approved_at: string | null;
  response_approved_by: string | null;
  responded_at: string | null;
  received_at: string;
  created_at: string;
}

export type PrivateFeedbackRow = {
  id: string;
  org_id: string;
  contact_id: string | null;
  request_id: string | null;
  rating: number | null;
  message: string | null;
  handled: boolean;
  created_at: string;
}

export type ManagerActionRequestRow = {
  id: string;
  org_id: string;
  agent: string;
  action: string;
  risk: ManagerActionRisk;
  status: ManagerActionStatus;
  payload: Json;
  requested_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Module Téléphone (0012) ────────────────────────────────────────────────
export type CallStatus = "missed" | "answered" | "voicemail";

export type CallRow = {
  id: string;
  org_id: string;
  caller_phone: string | null;
  caller_name: string | null;
  summary: string | null;
  recording_url: string | null;
  status: CallStatus;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}

export type PhoneSettingsRow = {
  id: string;
  org_id: string;
  greeting_message: string;
  transfer_number: string | null;
  active_hours: Json;
  auto_sms_on_miss: boolean;
  created_at: string;
  updated_at: string;
}

// ── Module Acquisition (0013) ──────────────────────────────────────────────
export type AdObjective = "visibility" | "leads" | "promo";
export type AdPlatform = "meta" | "google" | "both";
export type AdCampaignStatus = "draft" | "active" | "paused" | "completed";

export type AdCampaignRow = {
  id: string;
  org_id: string;
  title: string;
  objective: AdObjective;
  platform: AdPlatform;
  budget: number;
  duration_days: number;
  status: AdCampaignStatus;
  ad_copy: string | null;
  ad_visual_url: string | null;
  created_at: string;
  updated_at: string;
}

export type AdCampaignReportRow = {
  id: string;
  org_id: string;
  campaign_id: string;
  report_date: string;
  impressions: number;
  clicks: number;
  leads_count: number;
  spend: number;
  created_at: string;
}

// ── Module Admin (0014) ────────────────────────────────────────────────────
export type DocumentType = "devis" | "facture" | "contrat";
export type DocumentStatus =
  | "draft"
  | "sent"
  | "signed"
  | "paid"
  | "overdue"
  | "cancelled";
export type ReminderChannel = "sms" | "email";

export type DocumentRow = {
  id: string;
  org_id: string;
  doc_type: DocumentType;
  title: string;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  content: Json;
  amount: number | null;
  due_date: string | null;
  status: DocumentStatus;
  signed_at: string | null;
  signature_url: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentReminderRow = {
  id: string;
  org_id: string;
  document_id: string;
  reminder_number: number;
  channel: ReminderChannel;
  sent_at: string;
}

// ── Schéma `Database` consommé par les clients Supabase typés ────────────────
// Chaque table doit exposer `Relationships` (contrat `GenericSchema` de
// supabase-js) ; sans ça le client dégrade chaque ligne en `never`.
type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      organizations: TableDef<
        OrganizationRow,
        WithDefaults<OrganizationRow, CommonGen | "updated_at" | "formula" | "sector">,
        Partial<OrganizationRow>
      >;
      profiles: TableDef<
        ProfileRow,
        WithDefaults<ProfileRow, "created_at" | "role" | "full_name">,
        Partial<ProfileRow>
      >;
      org_modules: TableDef<
        OrgModuleRow,
        WithDefaults<OrgModuleRow, CommonGen | "updated_at" | "enabled" | "config">,
        Partial<OrgModuleRow>
      >;
      contacts: TableDef<
        ContactRow,
        WithDefaults<ContactRow, CommonGen | "updated_at" | "source">,
        Partial<ContactRow>
      >;
      leads: TableDef<
        LeadRow,
        WithDefaults<LeadRow, CommonGen | "status" | "source">,
        Partial<LeadRow>
      >;
      activities: TableDef<
        ActivityRow,
        WithDefaults<ActivityRow, CommonGen>,
        Partial<ActivityRow>
      >;
      site_content: TableDef<
        SiteContentRow,
        WithDefaults<SiteContentRow, "id" | "updated_at" | "content" | "position" | "published">,
        Partial<SiteContentRow>
      >;
      offers: TableDef<
        OfferRow,
        WithDefaults<OfferRow, CommonGen | "active">,
        Partial<OfferRow>
      >;
      loyalty_cards: TableDef<
        LoyaltyCardRow,
        WithDefaults<LoyaltyCardRow, CommonGen | "updated_at" | "points" | "card_token">,
        Partial<LoyaltyCardRow>
      >;
      loyalty_transactions: TableDef<
        LoyaltyTransactionRow,
        WithDefaults<LoyaltyTransactionRow, CommonGen>,
        Partial<LoyaltyTransactionRow>
      >;
      loyalty_rewards: TableDef<
        LoyaltyRewardRow,
        WithDefaults<LoyaltyRewardRow, CommonGen | "active">,
        Partial<LoyaltyRewardRow>
      >;
      campaigns: TableDef<
        CampaignRow,
        WithDefaults<CampaignRow, CommonGen | "updated_at" | "template" | "active">,
        Partial<CampaignRow>
      >;
      messages: TableDef<
        MessageRow,
        WithDefaults<MessageRow, "id" | "sent_at" | "cost_units">,
        Partial<MessageRow>
      >;
      usage_metering: TableDef<
        UsageMeteringRow,
        WithDefaults<UsageMeteringRow, "id" | "updated_at" | "quantity">,
        Partial<UsageMeteringRow>
      >;
      daily_digest: TableDef<
        DailyDigestRow,
        WithDefaults<DailyDigestRow, CommonGen | "summary">,
        Partial<DailyDigestRow>
      >;
      audit_log: TableDef<
        AuditLogRow,
        WithDefaults<AuditLogRow, CommonGen | "payload">,
        Partial<AuditLogRow>
      >;
      review_requests: TableDef<
        ReviewRequestRow,
        WithDefaults<ReviewRequestRow, CommonGen | "status">,
        Partial<ReviewRequestRow>
      >;
      reviews: TableDef<
        ReviewRow,
        WithDefaults<ReviewRow, CommonGen | "source" | "sentiment" | "received_at">,
        Partial<ReviewRow>
      >;
      private_feedback: TableDef<
        PrivateFeedbackRow,
        WithDefaults<PrivateFeedbackRow, CommonGen | "handled">,
        Partial<PrivateFeedbackRow>
      >;
      manager_action_requests: TableDef<
        ManagerActionRequestRow,
        WithDefaults<ManagerActionRequestRow, CommonGen | "updated_at" | "risk" | "status" | "payload">,
        Partial<ManagerActionRequestRow>
      >;
      calls: TableDef<
        CallRow,
        WithDefaults<CallRow, CommonGen | "updated_at" | "status" | "duration_seconds">,
        Partial<CallRow>
      >;
      phone_settings: TableDef<
        PhoneSettingsRow,
        WithDefaults<PhoneSettingsRow, CommonGen | "updated_at" | "greeting_message" | "active_hours" | "auto_sms_on_miss">,
        Partial<PhoneSettingsRow>
      >;
      ad_campaigns: TableDef<
        AdCampaignRow,
        WithDefaults<AdCampaignRow, CommonGen | "updated_at" | "status" | "platform" | "budget" | "duration_days">,
        Partial<AdCampaignRow>
      >;
      ad_campaign_reports: TableDef<
        AdCampaignReportRow,
        WithDefaults<AdCampaignReportRow, CommonGen | "impressions" | "clicks" | "leads_count" | "spend">,
        Partial<AdCampaignReportRow>
      >;
      documents: TableDef<
        DocumentRow,
        WithDefaults<DocumentRow, CommonGen | "updated_at" | "content" | "status">,
        Partial<DocumentRow>
      >;
      payment_reminders: TableDef<
        PaymentReminderRow,
        WithDefaults<PaymentReminderRow, "id" | "sent_at">,
        Partial<PaymentReminderRow>
      >;
    };
    Views: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Functions: {
      current_org_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_loyalty_card_by_token: {
        Args: { p_token: string };
        Returns: { points: number; rewards: Json }[];
      };
      convert_lead_to_contact: {
        Args: { p_lead_id: string; p_type: ContactType };
        Returns: ContactRow;
      };
      create_public_lead: {
        Args: {
          p_slug: string;
          p_name: string;
          p_phone: string;
          p_email: string;
          p_message: string;
          p_source_url?: string | null;
        };
        Returns: string;
      };
      create_private_feedback_for_request: {
        Args: {
          p_request_id: string;
          p_rating: number;
          p_message: string;
        };
        Returns: string;
      };
    };
    Enums: {
      formula: Formula;
      profile_role: ProfileRole;
      module_key: ModuleKey;
      contact_type: ContactType;
      contact_source: ContactSource;
      pipeline_status: PipelineStatus;
      lead_status: LeadStatus;
      activity_type: ActivityType;
      block_type: BlockType;
      loyalty_reason: LoyaltyReason;
      campaign_trigger: CampaignTrigger;
      channel: Channel;
      usage_metric: UsageMetric;
      review_request_status: ReviewRequestStatus;
      review_source: ReviewSource;
      review_sentiment: ReviewSentiment;
      manager_action_status: ManagerActionStatus;
      manager_action_risk: ManagerActionRisk;
      call_status: CallStatus;
    };
  };
}
