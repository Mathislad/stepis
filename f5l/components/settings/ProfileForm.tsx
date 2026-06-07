"use client";

import { useActionState } from "react";
import { saveProfileAction, type SettingsFormState } from "@/lib/settings/actions";
import { Input } from "@/components/ui/Input";
import type { ProfileRow } from "@/types/database";

const INITIAL: SettingsFormState = { ok: false, error: null };

export function ProfileForm({ profile, email }: { profile: ProfileRow; email: string }) {
  const [state, formAction, pending] = useActionState(saveProfileAction, INITIAL);
  return (
    <form action={formAction} className="surface flex flex-col gap-4 p-5">
      <h2 className="text-sm font-medium text-[var(--text-2)]">Mes informations</h2>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--text-2)]">E-mail</span>
        <Input value={email} readOnly disabled />
        <span className="text-[11px] text-[var(--muted)]">
          Le changement d&apos;e-mail nécessitera une vérification — bientôt disponible.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--text-2)]">Votre nom</span>
        <Input name="full_name" maxLength={120} defaultValue={profile.full_name ?? ""} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--text-2)]">Rôle</span>
        <Input value={profile.role === "owner" ? "Propriétaire" : "Collaborateur"} readOnly disabled />
      </label>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sm" style={{ color: "var(--green)" }}>Enregistré ✓</p>}

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
