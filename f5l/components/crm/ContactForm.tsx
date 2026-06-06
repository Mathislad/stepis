"use client";

import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import {
  createContactAction,
  updateContactAction,
  type CrmFormState,
} from "@/lib/crm/actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PIPELINE_LABELS } from "@/lib/crm/labels";
import type { ContactRow, ContactType } from "@/types/database";

const INITIAL: CrmFormState = { ok: false, error: null };

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-[var(--text-2)]">
        {label}
        {required && " *"}
      </span>
      {children}
    </label>
  );
}

/** Formulaire de contact (création / édition), champs adaptés au type. */
export function ContactForm({
  mode,
  contact,
}: {
  mode: "create" | "edit";
  contact?: ContactRow;
}) {
  const action = mode === "create" ? createContactAction : updateContactAction;
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const [type, setType] = useState<ContactType>(contact?.type ?? "b2c");

  return (
    <form action={formAction} className="surface flex flex-col gap-4 p-5">
      {mode === "edit" && contact && (
        <input type="hidden" name="contactId" value={contact.id} />
      )}

      <Field label="Type">
        <Select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as ContactType)}
        >
          <option value="b2c">Particulier (B2C)</option>
          <option value="b2b">Professionnel (B2B)</option>
        </Select>
      </Field>

      <Field label="Nom" required>
        <Input name="name" required defaultValue={contact?.name ?? ""} placeholder="Nom du contact" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Téléphone">
          <Input name="phone" defaultValue={contact?.phone ?? ""} />
        </Field>
        <Field label="E-mail">
          <Input name="email" type="email" defaultValue={contact?.email ?? ""} />
        </Field>
      </div>

      <Field label="Adresse">
        <Input name="address" defaultValue={contact?.address ?? ""} />
      </Field>

      {type === "b2b" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Secteur">
            <Input name="sector" defaultValue={contact?.sector ?? ""} />
          </Field>
          <Field label="Valeur potentielle (€)">
            <Input
              name="potential_value"
              inputMode="decimal"
              defaultValue={contact?.potential_value?.toString() ?? ""}
            />
          </Field>
          <Field label="Pipeline">
            <Select name="pipeline_status" defaultValue={contact?.pipeline_status ?? ""}>
              <option value="">—</option>
              {Object.entries(PIPELINE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Récurrence">
            <Input
              name="recurrence"
              defaultValue={contact?.recurrence ?? ""}
              placeholder="ex. hebdomadaire"
            />
          </Field>
          <Field label="Anniversaire">
            <Input name="birthday" type="date" defaultValue={contact?.birthday ?? ""} />
          </Field>
        </div>
      )}

      <Field label="Note">
        <Textarea name="note" defaultValue={contact?.note ?? ""} />
      </Field>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && mode === "edit" && (
        <p className="text-sm" style={{ color: "var(--green)" }}>
          Enregistré ✓
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending
            ? "Enregistrement…"
            : mode === "create"
              ? "Créer le contact"
              : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
