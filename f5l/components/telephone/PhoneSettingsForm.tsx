"use client";

import { useActionState } from "react";
import { savePhoneSettingsAction, type PhoneFormState } from "@/lib/telephone/actions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { PhoneSettingsRow } from "@/types/database";

const INITIAL: PhoneFormState = { ok: false, error: null };

export function PhoneSettingsForm({ settings }: { settings: PhoneSettingsRow | null }) {
  const [state, formAction, pending] = useActionState(savePhoneSettingsAction, INITIAL);

  return (
    <form action={formAction} className="surface flex flex-col gap-4 p-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--text-2)]">Message d&apos;accueil</span>
        <Textarea
          name="greeting_message"
          required
          maxLength={600}
          rows={3}
          defaultValue={
            settings?.greeting_message ??
            "Bonjour, vous êtes bien chez nous. Laissez votre message après le bip."
          }
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--text-2)]">Numéro de transfert (optionnel)</span>
        <Input
          name="transfer_number"
          type="tel"
          maxLength={40}
          defaultValue={settings?.transfer_number ?? ""}
          placeholder="+33 6 12 34 56 78"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="auto_sms_on_miss"
          defaultChecked={settings?.auto_sms_on_miss ?? true}
        />
        Envoyer un SMS automatique après un appel manqué
      </label>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm" style={{ color: "var(--green)" }}>
          Paramètres enregistrés ✓
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
