import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/auth/context";
import type {
  Channel,
  PrivateFeedbackRow,
  ReviewRequestRow,
  ReviewRow,
} from "@/types/database";

export interface ReputationStats {
  reviewRequests: number;
  sentRequests: number;
  reviews: number;
  averageRating: number | null;
  privateFeedbackOpen: number;
  responseDrafts: number;
  approvedResponses: number;
}

export interface ReputationSnapshot {
  stats: ReputationStats;
  reviewRequests: ReviewRequestRow[];
  reviews: ReviewRow[];
  privateFeedback: PrivateFeedbackRow[];
}

function dedupePeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function getReputationSnapshot(): Promise<ReputationSnapshot> {
  const supabase = await createClient();
  const [requestsRes, reviewsRes, feedbackRes] = await Promise.all([
    supabase.from("review_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("reviews").select("*").order("received_at", { ascending: false }),
    supabase.from("private_feedback").select("*").order("created_at", { ascending: false }),
  ]);
  if (requestsRes.error) {
    throw new Error(`getReputationSnapshot(requests): ${requestsRes.error.message}`);
  }
  if (reviewsRes.error) {
    throw new Error(`getReputationSnapshot(reviews): ${reviewsRes.error.message}`);
  }
  if (feedbackRes.error) {
    throw new Error(`getReputationSnapshot(feedback): ${feedbackRes.error.message}`);
  }

  const reviewRequests = requestsRes.data ?? [];
  const reviews = reviewsRes.data ?? [];
  const privateFeedback = feedbackRes.data ?? [];
  const ratings = reviews
    .map((review) => review.rating)
    .filter((rating): rating is number => typeof rating === "number");

  return {
    reviewRequests,
    reviews,
    privateFeedback,
    stats: {
      reviewRequests: reviewRequests.length,
      sentRequests: reviewRequests.filter((request) => request.status === "sent").length,
      reviews: reviews.length,
      averageRating:
        ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : null,
      privateFeedbackOpen: privateFeedback.filter((feedback) => !feedback.handled).length,
      responseDrafts: reviews.filter((review) => Boolean(review.response_draft)).length,
      approvedResponses: reviews.filter((review) => Boolean(review.response_approved_at)).length,
    },
  };
}

export async function getReview(id: string): Promise<ReviewRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getReview: ${error.message}`);
  return data;
}

export async function saveReviewResponseDraft(input: {
  reviewId: string;
  draft: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({
      response_draft: input.draft,
      response_draft_generated_at: new Date().toISOString(),
      response_approved_at: null,
      response_approved_by: null,
    })
    .eq("id", input.reviewId);
  if (error) throw new Error(`saveReviewResponseDraft: ${error.message}`);
}

export async function approveReviewResponseDraft(input: {
  reviewId: string;
  approvedBy: string;
}): Promise<void> {
  const supabase = await createClient();
  const { data: review, error: readError } = await supabase
    .from("reviews")
    .select("id, response_draft")
    .eq("id", input.reviewId)
    .maybeSingle();
  if (readError) throw new Error(`approveReviewResponseDraft(read): ${readError.message}`);
  if (!review?.response_draft) throw new Error("Aucun brouillon à approuver.");

  const { error } = await supabase
    .from("reviews")
    .update({
      response_approved_at: new Date().toISOString(),
      response_approved_by: input.approvedBy,
    })
    .eq("id", input.reviewId);
  if (error) throw new Error(`approveReviewResponseDraft(update): ${error.message}`);
}

export async function queueReviewRequests(channel: Channel): Promise<string[]> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("queueReviewRequests: organisation introuvable.");

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, phone, email")
    .eq("type", "b2c");
  if (contactsError) {
    throw new Error(`queueReviewRequests(contacts): ${contactsError.message}`);
  }

  const eligible = (contacts ?? []).filter((contact) =>
    channel === "email" ? Boolean(contact.email) : Boolean(contact.phone),
  );
  if (eligible.length === 0) return [];

  const period = dedupePeriod();
  const dedupeKeys = eligible.map((contact) => `${channel}:${contact.id}:${period}`);
  const { data: existing, error: existingError } = await supabase
    .from("review_requests")
    .select("dedupe_key")
    .in("dedupe_key", dedupeKeys);
  if (existingError) {
    throw new Error(`queueReviewRequests(existing): ${existingError.message}`);
  }

  const existingKeys = new Set(
    (existing ?? [])
      .map((row) => row.dedupe_key)
      .filter((key): key is string => Boolean(key)),
  );
  const rows = eligible
    .map((contact) => ({
      org_id: orgId,
      contact_id: contact.id,
      channel,
      status: "queued" as const,
      dedupe_key: `${channel}:${contact.id}:${period}`,
    }))
    .filter((row) => !existingKeys.has(row.dedupe_key));
  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from("review_requests")
    .insert(rows)
    .select("id");
  if (error) throw new Error(`queueReviewRequests: ${error.message}`);
  return (data ?? []).map((row) => row.id);
}

export async function markFeedbackHandled(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("private_feedback")
    .update({ handled: true })
    .eq("id", id);
  if (error) throw new Error(`markFeedbackHandled: ${error.message}`);
}
