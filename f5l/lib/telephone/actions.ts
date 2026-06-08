"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireModule } from "@/lib/auth/require-module";
import { upsertPhoneSettings } from "@/lib/telephone/settings";
import { getCall } from "@/lib/telephone/calls";
import { sendMissedCallSms } from "@/lib/telephone/missed-call-sms";

export interface PhoneFormState {
  ok: boolean;
  error: string | null;
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function optStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

export async function savePhoneSettingsAction(
  _prev: PhoneFormState,
  fd: FormData,
): Promise<PhoneFormState> {
  await requireModule("phone");
  const greeting = str(fd, "greeting_message");
  if (!greeting) return { ok: false, error: "Le message d'accueil est requis." };
  if (greeting.length > 600) return { ok: false, error: "Message trop long (600 caractères max)." };

  try {
    await upsertPhoneSettings({
      greeting_message: greeting,
      transfer_number: optStr(fd, "transfer_number"),
      auto_sms_on_miss: fd.get("auto_sms_on_miss") === "on",
    });
  } catch {
    return { ok: false, error: "Enregistrement impossible." };
  }
  revalidatePath("/telephone");
  revalidatePath("/telephone/settings");
  return { ok: true, error: null };
}

export async function rappelerAction(fd: FormData): Promise<void> {
  const ctx = await requireModule("phone");
  const callId = str(fd, "callId");
  if (!callId) redirect("/telephone");
  const call = await getCall(callId);
  if (!call) redirect("/telephone");
  // Best-effort SMS pour confirmer le rappel.
  try {
    await sendMissedCallSms({ orgName: ctx.org.name, callerPhone: call.caller_phone });
  } catch (e) {
    console.error("[rappelerAction]", e);
  }
  revalidatePath(`/telephone/${callId}`);
}
