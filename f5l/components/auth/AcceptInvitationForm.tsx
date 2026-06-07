"use client";

import { useActionState } from "react";
import { acceptInvitationAction, type SignupFormState } from "@/lib/onboarding/actions";
import { Input } from "@/components/ui/Input";

const INITIAL: SignupFormState = { ok: false, error: null };

export function AcceptInvitationForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, pending] = useActionState(acceptInvitationAction, INITIAL);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-[var(--text-2)]">E-mail</span>
        <Input value={email} readOnly disabled />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-[var(--text-2)]">Votre nom (optionnel)</span>
        <Input name="fullName" placeholder="Jean Dupont" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-[var(--text-2)]">Mot de passe</span>
        <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
        <span className="text-[11px] text-[var(--muted)]">
          Si vous avez déjà un compte F5L, entrez votre mot de passe existant.
        </span>
      </label>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary mt-2" disabled={pending}>
        {pending ? "Validation…" : "Rejoindre l'équipe"}
      </button>
    </form>
  );
}
