import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignWithTemplate } from "@/lib/loyalty-agent/campaigns";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

interface AudienceContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  last_visit_at: string | null;
}

export interface CampaignDraft {
  contactId: string;
  contactName: string;
  destination: string;
  subject: string | null;
  body: string;
  dedupeKey: string;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function renderTemplate(
  value: string | null,
  params: { contact: AudienceContact; orgName: string; offer: string | null },
): string | null {
  if (!value) return null;
  return value
    .replaceAll("{{prenom}}", firstName(params.contact.name))
    .replaceAll("{{name}}", params.contact.name)
    .replaceAll("{{nom}}", params.contact.name)
    .replaceAll("{{commerce}}", params.orgName)
    .replaceAll("{{offre}}", params.offer ?? "");
}

function destinationFor(campaign: CampaignWithTemplate, contact: AudienceContact): string | null {
  if (campaign.channel === "email") return contact.email;
  return contact.phone;
}

function dedupePeriod(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function buildCampaignDrafts(
  campaign: CampaignWithTemplate,
  orgName: string,
  limit = 5,
): Promise<CampaignDraft[]> {
  const supabase = await createClient();
  return buildCampaignDraftsWithClient(supabase, campaign, orgName, { limit });
}

export async function buildCampaignDraftsWithClient(
  supabase: DbClient,
  campaign: CampaignWithTemplate,
  orgName: string,
  options: { orgId?: string; limit?: number } = {},
): Promise<CampaignDraft[]> {
  const limit = options.limit ?? 5;
  let contactsQuery = supabase
    .from("contacts")
    .select("id, name, phone, email, birthday, last_visit_at")
    .eq("type", "b2c")
    .order("name", { ascending: true });
  if (options.orgId) contactsQuery = contactsQuery.eq("org_id", options.orgId);

  const { data: contacts, error } = await contactsQuery;
  if (error) throw new Error(`buildCampaignDrafts(contacts): ${error.message}`);

  let audience = contacts ?? [];

  if (campaign.trigger === "inactive") {
    const inactiveDays = campaign.templateData.inactiveDays ?? 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - inactiveDays);
    audience = audience.filter((contact) => {
      if (!contact.last_visit_at) return false;
      return new Date(contact.last_visit_at).getTime() <= cutoff.getTime();
    });
  } else if (campaign.trigger === "birthday") {
    audience = audience.filter((contact) => Boolean(contact.birthday));
  } else if (campaign.trigger === "post_purchase") {
    let cardsQuery = supabase
      .from("loyalty_cards")
      .select("contact_id");
    if (options.orgId) cardsQuery = cardsQuery.eq("org_id", options.orgId);
    const { data: cards, error: cardsError } = await cardsQuery;
    if (cardsError) throw new Error(`buildCampaignDrafts(cards): ${cardsError.message}`);
    const cardContacts = new Set((cards ?? []).map((card) => card.contact_id));
    audience = audience.filter((contact) => cardContacts.has(contact.id));
  }

  return audience
    .map((contact) => {
      const destination = destinationFor(campaign, contact);
      if (!destination) return null;

      const subject = renderTemplate(campaign.templateData.subject, {
        contact,
        orgName,
        offer: campaign.templateData.offer,
      });
      const body = renderTemplate(campaign.templateData.body, {
        contact,
        orgName,
        offer: campaign.templateData.offer,
      });
      if (!body) return null;

      return {
        contactId: contact.id,
        contactName: contact.name,
        destination,
        subject,
        body,
        dedupeKey: `${campaign.id}:${contact.id}:${campaign.trigger}:${dedupePeriod()}`,
      };
    })
    .filter((draft): draft is CampaignDraft => Boolean(draft))
    .slice(0, limit);
}
