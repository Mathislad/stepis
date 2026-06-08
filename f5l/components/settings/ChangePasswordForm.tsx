"use client";

import { useActionState, useRef, useEffect } from "react";
import { changePasswordAction, type SettingsFormState } from "@/lib/settings/actions";
import { Input } from "@/components/ui/Input";

const INITIAL: SettingsFormState = { ok: false, error: null };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="surface flex flex-col gap-3 p-5">
      <h2 className="text-sm font-medium text-[var(--text-2)]">Mot de passe</h2>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--text-2)]">Nouveau mot de passe</span>
        <Input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="8 caractères minimum"
        />
      </label>
      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sm" style={{ color: "var(--green)" }}>Mot de passe mis à jour ✓</p>}
      <div className="flex justify-end">
        <button type="submit" className="btn btn-ghost" disabled={pending}>
          {pending ? "Mise à jour…" : "Changer mon mot de passe"}
        </button>
      </div>
    </form>
  );
}
