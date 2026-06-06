import { createAdminClient } from "@/lib/supabase/admin";

export interface PublicReviewRequest {
  id: string;
  orgName: string;
}

export async function getPublicReviewRequest(
  requestId: string,
): Promise<PublicReviewRequest | null> {
  const admin = createAdminClient();
  const { data: request, error } = await admin
    .from("review_requests")
    .select("id, org_id")
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw new Error(`getPublicReviewRequest(request): ${error.message}`);
  if (!request) return null;

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("name")
    .eq("id", request.org_id)
    .maybeSingle();
  if (orgError) throw new Error(`getPublicReviewRequest(org): ${orgError.message}`);

  return { id: request.id, orgName: org?.name ?? "ce commerce" };
}
