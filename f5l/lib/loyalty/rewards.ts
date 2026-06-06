import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/auth/context";
import type { LoyaltyRewardRow } from "@/types/database";

export interface RewardInput {
  label: string;
  points_required: number;
  active?: boolean;
}

export async function listRewards(): Promise<LoyaltyRewardRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_rewards")
    .select("*")
    .order("points_required", { ascending: true });
  if (error) throw new Error(`listRewards: ${error.message}`);
  return data ?? [];
}

export async function getReward(id: string): Promise<LoyaltyRewardRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_rewards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getReward: ${error.message}`);
  return data ?? null;
}

export async function createReward(input: RewardInput): Promise<LoyaltyRewardRow> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("createReward: organisation introuvable.");
  const { data, error } = await supabase
    .from("loyalty_rewards")
    .insert({ ...input, org_id: orgId })
    .select("*")
    .single();
  if (error) throw new Error(`createReward: ${error.message}`);
  return data;
}

export async function updateReward(
  id: string,
  input: Partial<RewardInput>,
): Promise<LoyaltyRewardRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_rewards")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`updateReward: ${error.message}`);
  return data;
}

export async function deleteReward(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_rewards").delete().eq("id", id);
  if (error) throw new Error(`deleteReward: ${error.message}`);
}

export async function toggleReward(id: string, active: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("loyalty_rewards")
    .update({ active })
    .eq("id", id);
  if (error) throw new Error(`toggleReward: ${error.message}`);
}
