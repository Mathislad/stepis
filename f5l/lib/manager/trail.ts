import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type ManagerTrailEvent =
  | "requested"
  | "approved"
  | "rejected"
  | "executed"
  | "failed";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function isRecord(value: Json | undefined): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberOf(value: Json | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function writeManagerTrail(params: {
  orgId: string;
  event: ManagerTrailEvent;
  requestId?: string;
  agent?: string;
}): Promise<void> {
  const supabase = await createClient();
  const digestDate = today();
  const { data: existing, error: readError } = await supabase
    .from("daily_digest")
    .select("summary")
    .eq("org_id", params.orgId)
    .eq("digest_date", digestDate)
    .maybeSingle();
  if (readError) throw new Error(`writeManagerTrail(read): ${readError.message}`);

  const previous = existing && isRecord(existing.summary) ? existing.summary : {};
  const manager = isRecord(previous.manager) ? previous.manager : {};
  const nextManager: Json = {
    ...manager,
    requested: numberOf(manager.requested) + (params.event === "requested" ? 1 : 0),
    approved: numberOf(manager.approved) + (params.event === "approved" ? 1 : 0),
    rejected: numberOf(manager.rejected) + (params.event === "rejected" ? 1 : 0),
    executed: numberOf(manager.executed) + (params.event === "executed" ? 1 : 0),
    failed: numberOf(manager.failed) + (params.event === "failed" ? 1 : 0),
    lastEvent: params.event,
    lastRequestId: params.requestId ?? null,
    lastAgent: params.agent ?? null,
    updatedAt: new Date().toISOString(),
  };

  const { error } = await supabase.from("daily_digest").upsert(
    {
      org_id: params.orgId,
      digest_date: digestDate,
      summary: {
        ...previous,
        manager: nextManager,
      },
    },
    { onConflict: "org_id,digest_date" },
  );
  if (error) throw new Error(`writeManagerTrail(upsert): ${error.message}`);
}
