import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export async function getMyProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(`getMyProfile: ${error.message}`);
  return data ?? null;
}

export async function updateMyProfile(input: { full_name?: string | null }): Promise<ProfileRow> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");
  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", user.id)
    .select("*")
    .single();
  if (error) throw new Error(`updateMyProfile: ${error.message}`);
  return data;
}

/** Change le mot de passe de l'utilisateur courant. */
export async function updateMyPassword(newPassword: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(`updateMyPassword: ${error.message}`);
}
