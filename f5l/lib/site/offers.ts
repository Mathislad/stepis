import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/auth/context";
import type { OfferRow } from "@/types/database";

export interface OfferInput {
  title: string;
  description?: string | null;
  discount?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  active?: boolean;
}

export async function listOffers(): Promise<OfferRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listOffers: ${error.message}`);
  return data ?? [];
}

export async function getOffer(id: string): Promise<OfferRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getOffer: ${error.message}`);
  return data ?? null;
}

export async function createOffer(input: OfferInput): Promise<OfferRow> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("createOffer: organisation introuvable.");
  const { data, error } = await supabase
    .from("offers")
    .insert({ ...input, org_id: orgId })
    .select("*")
    .single();
  if (error) throw new Error(`createOffer: ${error.message}`);
  return data;
}

export async function updateOffer(id: string, input: Partial<OfferInput>): Promise<OfferRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offers")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`updateOffer: ${error.message}`);
  return data;
}

export async function deleteOffer(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("offers").delete().eq("id", id);
  if (error) throw new Error(`deleteOffer: ${error.message}`);
}
