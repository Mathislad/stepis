"use client";

import { useActionState, useEffect, useRef } from "react";
import { addActivityAction, type CrmFormState } from "@/lib/crm/actions";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ACTIVITY_LABELS } from "@/lib/crm/labels";

const INITIAL: CrmFormState = { ok: false, error: null };

/** Ajout d'une entrée au journal d'activité (note / appel / e-mail…). */
export function ActivityComposer({ contactId }: { contactId: string }) {
  const [state, formAction, pending] = useActionState(addActivityAction, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  // Réinitialise le formulaire après chaque ajout réussi (nouvelle identité de state).
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="surface flex flex-col gap-3 p-4">
      <input type="hidden" name="contactId" value={contactId} />
      <div className="flex items-center gap-2">
        <Select
          name="type"
          defaultValue="note"
          style={{ width: "auto" }}
          aria-label="Type d'activité"
          className="py-1.5"
        >
          {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <span className="text-[13px] text-[var(--text-2)]">Nouvelle entrée</span>
      </div>
      <Textarea name="content" required placeholder="Détails de l'échange…" />
      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary px-4 py-1.5 text-[13px]"
          disabled={pending}
        >
          {pending ? "Ajout…" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}
