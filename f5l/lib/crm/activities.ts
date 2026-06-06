import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/context";
import type { ActivityRow, ActivityType } from "@/types/database";

export async function listActivities(contactId: string): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listActivities: ${error.message}`);
  return data ?? [];
}

export async function addActivity(
  contactId: string,
  input: { type: ActivityType; content: string },
): Promise<ActivityRow> {
  const supabase = await createClient();
  const ctx = await getOrgContext();
  if (!ctx) throw new Error("addActivity: session introuvable.");

  const { data, error } = await supabase
    .from("activities")
    .insert({
      org_id: ctx.org.id, // résolu serveur (RLS WITH CHECK valide)
      contact_id: contactId,
      type: input.type,
      content: input.content,
      created_by: ctx.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(`addActivity: ${error.message}`);
  return data;
}
