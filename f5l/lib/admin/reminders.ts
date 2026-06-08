import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/auth/context";
import { brevoPost } from "@/lib/brevo/client";
import { getDocument } from "@/lib/admin/documents";
import type {
  DocumentRow,
  PaymentReminderRow,
  ReminderChannel,
} from "@/types/database";

function sender() {
  return {
    name: process.env.BREVO_SENDER_NAME || "F5L",
    email: process.env.BREVO_SENDER_EMAIL || "no-reply@stepis.fr",
  };
}
function smsSender() {
  return (process.env.BREVO_SMS_SENDER || "F5L").slice(0, 11);
}

async function nextReminderNumber(documentId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("payment_reminders")
    .select("*", { count: "exact", head: true })
    .eq("document_id", documentId);
  return (count ?? 0) + 1;
}

async function dispatch(channel: ReminderChannel, doc: DocumentRow, orgName: string): Promise<void> {
  if (!process.env.BREVO_API_KEY) {
    console.warn("[reminders] BREVO_API_KEY absente — relance journalisée seulement.");
    return;
  }
  const title = doc.title;
  const amountStr = doc.amount != null ? ` (${doc.amount} €)` : "";
  if (channel === "email" && doc.recipient_email) {
    await brevoPost("/smtp/email", {
      sender: sender(),
      to: [{ email: doc.recipient_email, name: doc.recipient_name ?? undefined }],
      subject: `Rappel : ${title}${amountStr}`,
      htmlContent: `<p>Bonjour ${doc.recipient_name ?? ""},</p>
        <p>Nous vous rappelons que le document <strong>${title}</strong>${amountStr} reste en attente.</p>
        <p>Merci par avance,<br/>— ${orgName}</p>`,
    });
  } else if (channel === "sms" && doc.recipient_phone) {
    await brevoPost("/transactionalSMS/sms", {
      sender: smsSender(),
      recipient: doc.recipient_phone,
      content: `${orgName} : rappel pour ${title}${amountStr}. Merci de régulariser à votre convenance.`,
    });
  } else {
    throw new Error("CONTACT_MISSING");
  }
}

/**
 * Envoie une relance et la journalise dans `payment_reminders`.
 * Si Brevo n'est pas configuré : la relance est tout de même journalisée
 * (preuve de l'intention) — comportement gracieux explicite.
 */
export async function sendReminder(
  documentId: string,
  channel: ReminderChannel,
  orgName: string,
): Promise<PaymentReminderRow> {
  const doc = await getDocument(documentId);
  if (!doc) throw new Error("DOCUMENT_NOT_FOUND");

  try {
    await dispatch(channel, doc, orgName);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "CONTACT_MISSING") throw e;
    console.error("[reminders] envoi échoué (relance journalisée):", e);
  }

  const reminder_number = await nextReminderNumber(documentId);
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("sendReminder: organisation introuvable.");
  const { data, error } = await supabase
    .from("payment_reminders")
    .insert({ org_id: orgId, document_id: documentId, reminder_number, channel })
    .select("*")
    .single();
  if (error) throw new Error(`sendReminder: ${error.message}`);
  return data;
}
