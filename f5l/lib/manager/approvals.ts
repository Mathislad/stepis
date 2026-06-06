import "server-only";
import { createClient } from "@/lib/supabase/server";
import { writeManagerTrail } from "@/lib/manager/trail";
import type {
  Json,
  ManagerActionRequestRow,
  ManagerActionRisk,
  ManagerActionStatus,
} from "@/types/database";

function isRecord(value: Json): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function listManagerActionRequests(): Promise<ManagerActionRequestRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("manager_action_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw new Error(`listManagerActionRequests: ${error.message}`);
  return data ?? [];
}

export async function createManagerActionRequest(input: {
  orgId: string;
  agent: string;
  action: string;
  risk?: ManagerActionRisk;
  payload?: Json;
  requestedBy?: string | null;
}): Promise<ManagerActionRequestRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("manager_action_requests")
    .insert({
      org_id: input.orgId,
      agent: input.agent,
      action: input.action,
      risk: input.risk ?? "medium",
      payload: input.payload ?? {},
      requested_by: input.requestedBy ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(`createManagerActionRequest: ${error.message}`);
  await writeManagerTrail({
    orgId: data.org_id,
    event: "requested",
    requestId: data.id,
    agent: data.agent,
  }).catch((trailError) => {
    console.error("[manager] trail requested impossible:", trailError);
  });
  return data;
}

export async function findPendingManagerActionRequest(input: {
  agent: string;
  payloadKey: string;
  payloadValue: string;
}): Promise<ManagerActionRequestRow | null> {
  const supabase = await createClient();
  const { data: requests, error } = await supabase
    .from("manager_action_requests")
    .select("*")
    .eq("agent", input.agent)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`findPendingManagerActionRequest: ${error.message}`);

  return (
    (requests ?? []).find((request) => {
      if (!isRecord(request.payload)) return false;
      return request.payload[input.payloadKey] === input.payloadValue;
    }) ?? null
  );
}

export async function reviewManagerActionRequest(input: {
  id: string;
  status: Extract<ManagerActionStatus, "approved" | "rejected">;
  reviewedBy: string;
}): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("manager_action_requests")
    .update({
      status: input.status,
      reviewed_by: input.reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("status", "pending")
    .select("id, org_id, agent")
    .maybeSingle();
  if (error) throw new Error(`reviewManagerActionRequest: ${error.message}`);
  if (data) {
    await writeManagerTrail({
      orgId: data.org_id,
      event: input.status === "approved" ? "approved" : "rejected",
      requestId: data.id,
      agent: data.agent,
    }).catch((trailError) => {
      console.error("[manager] trail review impossible:", trailError);
    });
  }
}

export async function claimManagerActionExecution(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("manager_action_requests")
    .update({ status: "executing" })
    .eq("id", id)
    .eq("status", "approved")
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`claimManagerActionExecution: ${error.message}`);
  return Boolean(data);
}

export async function markManagerActionExecuted(id: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("manager_action_requests")
    .update({ status: "executed" })
    .eq("id", id)
    .eq("status", "executing")
    .select("id, org_id, agent")
    .maybeSingle();
  if (error) throw new Error(`markManagerActionExecuted: ${error.message}`);
  if (data) {
    await writeManagerTrail({
      orgId: data.org_id,
      event: "executed",
      requestId: data.id,
      agent: data.agent,
    }).catch((trailError) => {
      console.error("[manager] trail executed impossible:", trailError);
    });
  }
}

export async function restoreManagerActionApproved(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("manager_action_requests")
    .update({ status: "approved" })
    .eq("id", id)
    .eq("status", "executing");
  if (error) throw new Error(`restoreManagerActionApproved: ${error.message}`);
}
