import { createClient } from "@/lib/supabase/server";
import type { OrganizationRow } from "@/types/database";

export interface OrgSettingsInput {
  name?: string;
  sector?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
}

export async function getOrgSettings(): Promise<OrganizationRow | null> {
  const supabase = await createClient();
  // RLS scope automatiquement à l'org de l'utilisateur courant.
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .maybeSingle();
  if (error) throw new Error(`getOrgSettings: ${error.message}`);
  return data ?? null;
}

export async function updateOrgSettings(input: OrgSettingsInput): Promise<OrganizationRow> {
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id").maybeSingle();
  if (!org) throw new Error("Organisation introuvable.");

  const { data, error } = await supabase
    .from("organizations")
    .update(input)
    .eq("id", org.id)
    .select("*")
    .single();
  if (error) throw new Error(`updateOrgSettings: ${error.message}`);
  return data;
}
