"use server";

import { createClient } from "@/lib/supabase/server";

export interface FeedbackFormState {
  ok: boolean;
  error: string | null;
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export async function submitPrivateFeedbackAction(
  _prev: FeedbackFormState,
  fd: FormData,
): Promise<FeedbackFormState> {
  const requestId = str(fd, "requestId");
  const message = str(fd, "message");
  const rating = Number.parseInt(str(fd, "rating"), 10);

  if (!requestId) return { ok: false, error: "Demande introuvable." };
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Choisissez une note entre 1 et 5." };
  }
  if (message.length > 1200) {
    return { ok: false, error: "Le message est trop long. Maximum : 1200 caractères." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_private_feedback_for_request", {
    p_request_id: requestId,
    p_rating: rating,
    p_message: message,
  });
  if (error) {
    return { ok: false, error: "Retour impossible, réessayez dans un instant." };
  }

  return { ok: true, error: null };
}
