import "server-only";
import { brevoPost } from "@/lib/brevo/client";
import { createClient } from "@/lib/supabase/server";
import type { Channel, ReviewRequestRow } from "@/types/database";

interface ContactForRequest {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface ReviewDispatchResult {
  sent: number;
  failed: number;
  skipped: number;
}

function senderEmail() {
  return {
    name: process.env.BREVO_SENDER_NAME || "F5L",
    email: process.env.BREVO_SENDER_EMAIL || "no-reply@stepis.fr",
  };
}

function smsSender() {
  return (process.env.BREVO_SMS_SENDER || "F5L").slice(0, 11);
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function esc(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function destination(channel: Channel, contact: ContactForRequest): string | null {
  if (channel === "email") return contact.email;
  if (channel === "sms") return contact.phone;
  return null;
}

async function sendReviewRequest(params: {
  orgName: string;
  request: ReviewRequestRow;
  contact: ContactForRequest;
  feedbackUrl: string;
}): Promise<void> {
  const to = destination(params.request.channel, params.contact);
  if (!to) throw new Error("MISSING_DESTINATION");

  if (params.request.channel === "email") {
    await brevoPost("/smtp/email", {
      sender: senderEmail(),
      to: [{ email: to, name: params.contact.name }],
      subject: `Votre avis compte — ${params.orgName}`,
      htmlContent: `
        <p>Bonjour ${esc(params.contact.name)},</p>
        <p>Merci pour votre passage chez ${esc(params.orgName)}.</p>
        <p>Vous pouvez partager votre retour privé ici :</p>
        <p><a href="${params.feedbackUrl}">${params.feedbackUrl}</a></p>
        <p>Ce lien n'est pas un filtre : votre avis public reste libre.</p>
      `,
    });
    return;
  }

  if (params.request.channel === "sms") {
    await brevoPost("/transactionalSMS/sms", {
      sender: smsSender(),
      recipient: to,
      content: `${params.orgName} vous remercie. Retour privé : ${params.feedbackUrl}`,
    });
    return;
  }

  throw new Error("UNSUPPORTED_CHANNEL");
}

export async function dispatchQueuedReviewRequests(params: {
  orgName: string;
  requestIds: string[];
}): Promise<ReviewDispatchResult> {
  if (!process.env.BREVO_API_KEY) {
    console.warn("[reputation] BREVO_API_KEY absente — demandes gardées en file.");
    return { sent: 0, failed: 0, skipped: params.requestIds.length };
  }

  const supabase = await createClient();
  const result: ReviewDispatchResult = { sent: 0, failed: 0, skipped: 0 };

  for (const requestId of params.requestIds) {
    const { data: request, error: requestError } = await supabase
      .from("review_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();
    if (requestError || !request || request.status === "sent") {
      result.skipped += 1;
      continue;
    }

    if (!request.contact_id) {
      await supabase.from("review_requests").update({ status: "failed" }).eq("id", request.id);
      result.failed += 1;
      continue;
    }

    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id, name, phone, email")
      .eq("id", request.contact_id)
      .maybeSingle();
    if (contactError || !contact) {
      await supabase.from("review_requests").update({ status: "failed" }).eq("id", request.id);
      result.failed += 1;
      continue;
    }

    const feedbackUrl = `${appUrl()}/feedback/${request.id}`;

    try {
      await sendReviewRequest({
        orgName: params.orgName,
        request,
        contact,
        feedbackUrl,
      });
      await supabase
        .from("review_requests")
        .update({ status: "sent", sent_at: new Date().toISOString(), request_url: feedbackUrl })
        .eq("id", request.id);
      result.sent += 1;
    } catch (e) {
      console.error("[reputation] dispatchQueuedReviewRequests:", e);
      await supabase.from("review_requests").update({ status: "failed" }).eq("id", request.id);
      result.failed += 1;
    }
  }

  return result;
}
