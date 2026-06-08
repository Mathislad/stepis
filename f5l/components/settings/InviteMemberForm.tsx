"use client";

import { useActionState, useRef, useEffect } from "react";
import { inviteMemberAction, type SettingsFormState } from "@/lib/settings/actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const INITIAL: SettingsFormState = { ok: false, error: null };

export function InviteMemberForm() {
  const [state, formAction, pending] = useActionState(inviteMemberAction, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="surface flex flex-col gap-3 p-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input name="email" type="email" required placeholder="collaborateur@example.fr" />
        <Select name="role" defaultValue="staff" style={{ width: "auto" }}>
          <option value="staff">Collaborateur</option>
          <option value="owner">Propriétaire</option>
        </Select>
      </div>
      <p className="text-[11px] text-[var(--muted)]">
        Un lien d&apos;invitation sera créé. Quand Brevo sera branché, il partira aussi par e-mail
        automatiquement.
      </p>
      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sm" style={{ color: "var(--green)" }}>Invitation créée ✓</p>}
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Envoi…" : "Inviter"}
        </button>
      </div>
    </form>
  );
}
