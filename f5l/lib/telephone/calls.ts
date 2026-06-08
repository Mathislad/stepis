import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/auth/context";
import type { CallRow, CallStatus } from "@/types/database";

export const CALLS_PAGE_SIZE = 20;

export interface CallListResult {
  rows: CallRow[];
  total: number;
  page: number;
  pageCount: number;
}

export interface CallInput {
  caller_phone?: string | null;
  caller_name?: string | null;
  summary?: string | null;
  recording_url?: string | null;
  status: CallStatus;
  duration_seconds?: number;
}

export async function listCalls(
  filters: { status?: CallStatus; page?: number } = {},
): Promise<CallListResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * CALLS_PAGE_SIZE;
  const to = from + CALLS_PAGE_SIZE - 1;

  let q = supabase
    .from("calls")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  if (filters.status) q = q.eq("status", filters.status);

  const { data, count, error } = await q.range(from, to);
  if (error) throw new Error(`listCalls: ${error.message}`);
  const total = count ?? 0;
  return {
    rows: data ?? [],
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / CALLS_PAGE_SIZE)),
  };
}

export async function getCall(id: string): Promise<CallRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calls")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getCall: ${error.message}`);
  return data ?? null;
}

/** Insère un call (utilisé par les futurs webhooks Vapi). `org_id` serveur. */
export async function createCall(input: CallInput): Promise<CallRow> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("createCall: organisation introuvable.");
  const { data, error } = await supabase
    .from("calls")
    .insert({ ...input, org_id: orgId })
    .select("*")
    .single();
  if (error) throw new Error(`createCall: ${error.message}`);
  return data;
}

export interface CallStats {
  total: number;
  missed: number;
  answered: number;
  avgDurationSec: number;
}

export async function getCallStats(): Promise<CallStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("calls").select("status, duration_seconds");
  if (error) throw new Error(`getCallStats: ${error.message}`);
  const rows = data ?? [];
  let missed = 0;
  let answered = 0;
  let totalSec = 0;
  let countWithDuration = 0;
  for (const r of rows) {
    if (r.status === "missed") missed++;
    else if (r.status === "answered") answered++;
    if (r.duration_seconds > 0) {
      totalSec += r.duration_seconds;
      countWithDuration++;
    }
  }
  return {
    total: rows.length,
    missed,
    answered,
    avgDurationSec: countWithDuration > 0 ? Math.round(totalSec / countWithDuration) : 0,
  };
}
