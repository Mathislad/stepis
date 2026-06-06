"use client";

import { useActionState } from "react";
import { createCardAction, type LoyaltyFormState } from "@/lib/loyalty/actions";
import { Select } from "@/components/ui/Select";

const INITIAL: LoyaltyFormState = { ok: false, error: null };

export function NewCardForm({ contacts }: { contacts: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createCardAction, INITIAL);

  if (contacts.length === 0) {
    return (
      <div className="surface p-6 text-center text-sm text-[var(--text-2)]">
        Tous vos contacts ont déjà une carte. Ajoutez d&apos;abord un contact dans le CRM.
      </div>
    );
  }

  return (
    <form action={formAction} className="surface flex flex-col gap-3 p-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--text-2)]">Contact</span>
        <Select name="contactId" defaultValue="">
          <option value="" disabled>
            Choisir un contact…
          </option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </label>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Création…" : "Créer la carte"}
        </button>
      </div>
    </form>
  );
}
