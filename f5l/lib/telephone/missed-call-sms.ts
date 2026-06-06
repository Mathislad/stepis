import "server-only";
import { brevoPost } from "@/lib/brevo/client";

/**
 * Envoie un SMS au numéro qui vient d'appeler en absence.
 * TOLÉRANT : pas de clé Brevo / pas de numéro → log, pas d'exception.
 */
export async function sendMissedCallSms(params: {
  orgName: string;
  callerPhone: string | null;
}): Promise<void> {
  if (!process.env.BREVO_API_KEY) {
    console.warn("[missed-call-sms] BREVO_API_KEY absente — SMS ignoré.");
    return;
  }
  if (!params.callerPhone) {
    console.warn("[missed-call-sms] caller_phone absent — SMS ignoré.");
    return;
  }
  const sender = (process.env.BREVO_SMS_SENDER || "F5L").slice(0, 11);
  try {
    await brevoPost("/transactionalSMS/sms", {
      sender,
      recipient: params.callerPhone,
      content: `Désolé d'avoir manqué votre appel — ${params.orgName}. Nous vous rappelons très vite.`,
    });
  } catch (e) {
    console.error("[missed-call-sms] envoi échoué:", e);
  }
}
