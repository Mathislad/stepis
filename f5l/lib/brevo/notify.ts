import "server-only";
import { brevoPost } from "@/lib/brevo/client";

export interface NotifyOrg {
  name: string;
  contact_phone: string | null;
  contact_email: string | null;
}

export interface NotifyLead {
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
}

function senderEmail() {
  return {
    name: process.env.BREVO_SENDER_NAME || "F5L",
    email: process.env.BREVO_SENDER_EMAIL || "no-reply@stepis.fr",
  };
}
function smsSender() {
  return (process.env.BREVO_SMS_SENDER || "F5L").slice(0, 11); // Brevo: 11 car. max
}

function esc(v: string | null | undefined): string {
  return (v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Notifie l'arrivée d'un nouveau lead via Brevo (email + SMS au commerçant,
 * confirmations au lead). TOLÉRANT AUX PANNES :
 *  - si `BREVO_API_KEY` est absente → on n'envoie rien (warn) ;
 *  - chaque envoi est isolé (`Promise.allSettled`), les échecs sont loggés
 *    en `console.error` mais ne propagent jamais d'exception.
 * Ne doit donc JAMAIS faire échouer la capture du lead.
 */
export async function notifyNewLead(org: NotifyOrg, lead: NotifyLead): Promise<void> {
  if (!process.env.BREVO_API_KEY) {
    console.warn("[brevo] BREVO_API_KEY absente — notifications ignorées.");
    return;
  }

  const sender = senderEmail();
  const leadName = lead.name?.trim() || "Un visiteur";
  const tasks: Array<Promise<unknown>> = [];

  // 1. Email au commerçant
  if (org.contact_email) {
    tasks.push(
      brevoPost("/smtp/email", {
        sender,
        to: [{ email: org.contact_email, name: org.name }],
        subject: `Nouveau lead — ${org.name}`,
        htmlContent: `
          <h2>Nouveau lead sur votre site F5L</h2>
          <p><strong>Nom :</strong> ${esc(lead.name)}</p>
          <p><strong>Téléphone :</strong> ${esc(lead.phone)}</p>
          <p><strong>E-mail :</strong> ${esc(lead.email)}</p>
          <p><strong>Message :</strong><br/>${esc(lead.message)}</p>
        `,
      }),
    );
  }

  // 2. SMS au commerçant
  if (org.contact_phone) {
    tasks.push(
      brevoPost("/transactionalSMS/sms", {
        sender: smsSender(),
        recipient: org.contact_phone,
        content: `Nouveau lead ${leadName} — ${lead.phone ?? "?"} sur votre site F5L`,
      }),
    );
  }

  // 3. E-mail de confirmation au lead
  if (lead.email) {
    tasks.push(
      brevoPost("/smtp/email", {
        sender,
        to: [{ email: lead.email, name: lead.name ?? undefined }],
        subject: `Bien reçu — ${org.name}`,
        htmlContent: `
          <p>Bonjour ${esc(lead.name) || ""},</p>
          <p>Nous avons bien reçu votre message et reviendrons vers vous très vite.</p>
          <p>— ${esc(org.name)}</p>
        `,
      }),
    );
  }

  // 4. SMS de confirmation au lead
  if (lead.phone) {
    tasks.push(
      brevoPost("/transactionalSMS/sms", {
        sender: smsSender(),
        recipient: lead.phone,
        content: `Merci ${leadName}, votre message a bien été reçu. ${org.name} vous recontacte vite.`,
      }),
    );
  }

  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[brevo] envoi échoué:", r.reason);
    }
  }
}
