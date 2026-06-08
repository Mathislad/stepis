import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrgId } from "@/lib/auth/context";
import type { InvitationRow, ProfileRole, ProfileRow } from "@/types/database";

export interface MemberRow extends ProfileRow {
  email: string | null;
}

/** Membres de l'org courante. Utilise admin pour lire l'e-mail (auth.users). */
export async function listMembers(): Promise<MemberRow[]> {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`listMembers: ${error.message}`);
  if (!profiles?.length) return [];

  const admin = createAdminClient();
  const emails = await Promise.all(
    profiles.map(async (p) => {
      const { data } = await admin.auth.admin.getUserById(p.id);
      return { id: p.id, email: data?.user?.email ?? null };
    }),
  );
  const emailById = new Map(emails.map((e) => [e.id, e.email]));
  return profiles.map((p) => ({ ...p, email: emailById.get(p.id) ?? null }));
}

export async function listPendingInvitations(): Promise<InvitationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("accepted", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listPendingInvitations: ${error.message}`);
  return data ?? [];
}

export async function createInvitation(
  email: string,
  role: ProfileRole = "staff",
): Promise<InvitationRow> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("Organisation introuvable.");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("invitations")
    .insert({ org_id: orgId, email, role, invited_by: user?.id ?? null })
    .select("*")
    .single();
  if (error) throw new Error(`createInvitation: ${error.message}`);
  return data;
}

export async function revokeInvitation(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("invitations").delete().eq("id", id);
  if (error) throw new Error(`revokeInvitation: ${error.message}`);
}

export async function removeMember(profileId: string): Promise<void> {
  const supabase = await createClient();
  // RLS empêche déjà la suppression cross-org. On supprime juste le profile
  // (la session du membre sera invalidée automatiquement à sa prochaine requête).
  const { error } = await supabase.from("profiles").delete().eq("id", profileId);
  if (error) throw new Error(`removeMember: ${error.message}`);
}
