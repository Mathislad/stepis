import { createClient } from "@/lib/supabase/server";
import type { ContactRow, ContactType, LeadRow, LeadStatus } from "@/types/database";

/** Sentinelles renvoyées par `convertLeadToContact` (mappées par l'action). */
export type ConvertError = "ALREADY_CONVERTED" | "NOT_FOUND";

export async function listLeads(
  filters: { status?: LeadStatus } = {},
): Promise<LeadRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw new Error(`listLeads: ${error.message}`);
  return data ?? [];
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) throw new Error(`updateLeadStatus: ${error.message}`);
}

/**
 * Conversion ATOMIQUE lead → contact via la RPC `convert_lead_to_contact`
 * (SECURITY INVOKER, RLS appliquée). La RPC :
 *  - refuse un lead déjà `converted` (anti-doublon),
 *  - fixe `contacts.source` = origine du lead (attribution ROI exacte).
 */
export async function convertLeadToContact(
  leadId: string,
  opts: { type: ContactType },
): Promise<ContactRow> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("convert_lead_to_contact", {
    p_lead_id: leadId,
    p_type: opts.type,
  });
  if (error) {
    if (error.message.includes("LEAD_ALREADY_CONVERTED")) {
      throw new Error("ALREADY_CONVERTED");
    }
    if (error.message.includes("LEAD_NOT_FOUND")) {
      throw new Error("NOT_FOUND");
    }
    throw new Error(`convertLeadToContact: ${error.message}`);
  }
  return data;
}
