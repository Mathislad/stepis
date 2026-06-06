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

/**
 * Envoie au client final le lien de sa carte de fidélité (email + SMS).
 * TOLÉRANT AUX PANNES — ne lève JAMAIS :
 *  - pas de `BREVO_API_KEY` → on ignore (warn) ;
 *  - contact sans téléphone NI email → on ignore (warn), pas d'exception ;
 *  - chaque envoi isolé (`Promise.allSettled`), échecs loggés.
 */
export async function sendLoyaltyCardLink(params: {
  orgName: string;
  contact: { name: string | null; phone: string | null; email: string | null };
  url: string;
}): Promise<void> {
  if (!process.env.BREVO_API_KEY) {
    console.warn("[brevo] BREVO_API_KEY absente — lien carte non envoyé.");
    return;
  }
  if (!params.contact.phone && !params.contact.email) {
    console.warn("[brevo] contact sans téléphone ni e-mail — lien carte non envoyé.");
    return;
  }

  const sender = senderEmail();
  const tasks: Array<Promise<unknown>> = [];

  if (params.contact.email) {
    tasks.push(
      brevoPost("/smtp/email", {
        sender,
        to: [{ email: params.contact.email, name: params.contact.name ?? undefined }],
        subject: `Votre carte de fidélité — ${params.orgName}`,
        htmlContent: `
          <p>Bonjour ${esc(params.contact.name) || ""},</p>
          <p>Voici le lien de votre carte de fidélité ${esc(params.orgName)} :</p>
          <p><a href="${params.url}">${params.url}</a></p>
        `,
      }),
    );
  }

  if (params.contact.phone) {
    tasks.push(
      brevoPost("/transactionalSMS/sms", {
        sender: smsSender(),
        recipient: params.contact.phone,
        content: `Votre carte de fidélité ${params.orgName} : ${params.url}`,
      }),
    );
  }

  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[brevo] lien carte échoué:", r.reason);
    }
  }
}

export async function notifyManagerActionRequest(params: {
  org: NotifyOrg;
  action: string;
  agent: string;
  risk: string;
}): Promise<void> {
  if (!process.env.BREVO_API_KEY) {
    console.warn("[brevo] BREVO_API_KEY absente — notification Manager ignorée.");
    return;
  }
  if (!params.org.contact_email && !params.org.contact_phone) return;

  const tasks: Array<Promise<unknown>> = [];
  if (params.org.contact_email) {
    tasks.push(
      brevoPost("/smtp/email", {
        sender: senderEmail(),
        to: [{ email: params.org.contact_email, name: params.org.name }],
        subject: `Validation requise — ${params.org.name}`,
        htmlContent: `
          <h2>Une action F5L attend votre validation</h2>
          <p><strong>Agent :</strong> ${esc(params.agent)}</p>
          <p><strong>Risque :</strong> ${esc(params.risk)}</p>
          <p><strong>Action :</strong> ${esc(params.action)}</p>
          <p>Ouvrez le Manager F5L pour approuver, refuser ou exécuter l'action.</p>
        `,
      }),
    );
  }
  if (params.org.contact_phone) {
    tasks.push(
      brevoPost("/transactionalSMS/sms", {
        sender: smsSender(),
        recipient: params.org.contact_phone,
        content: `F5L Manager : validation requise (${params.agent}) - ${params.action}`,
      }),
    );
  }

  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[brevo] notification Manager échouée:", r.reason);
    }
  }
}
