import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/auth/context";
import type { PhoneSettingsRow } from "@/types/database";

export interface PhoneSettingsInput {
  greeting_message?: string;
  transfer_number?: string | null;
  active_hours?: { days: { label: string; open: string; close: string; closed: boolean }[] };
  auto_sms_on_miss?: boolean;
}

export async function getPhoneSettings(): Promise<PhoneSettingsRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("phone_settings")
    .select("*")
    .maybeSingle();
  if (error) throw new Error(`getPhoneSettings: ${error.message}`);
  return data ?? null;
}

/** Upsert sur `org_id` (unique). `org_id` résolu serveur. */
export async function upsertPhoneSettings(
  input: PhoneSettingsInput,
): Promise<PhoneSettingsRow> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("upsertPhoneSettings: organisation introuvable.");

  const row = { org_id: orgId, ...input };
  const { data, error } = await supabase
    .from("phone_settings")
    .upsert(row, { onConflict: "org_id" })
    .select("*")
    .single();
  if (error) throw new Error(`upsertPhoneSettings: ${error.message}`);
  return data;
}
