"use client";

import { useActionState } from "react";
import { createDocumentAction, type AdminFormState } from "@/lib/admin/actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DOC_TYPE_LABELS } from "@/lib/admin/labels";
import type { DocumentType } from "@/types/database";

const INITIAL: AdminFormState = { ok: false, error: null };

export function NewDocumentForm() {
  const [state, formAction, pending] = useActionState(createDocumentAction, INITIAL);

  return (
    <form action={formAction} className="surface flex flex-col gap-4 p-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--text-2)]">Type</span>
        <Select name="doc_type" defaultValue="devis">
          {(Object.entries(DOC_TYPE_LABELS) as [DocumentType, string][]).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] text-[var(--text-2)]">Titre</span>
        <Input name="title" required maxLength={200} placeholder="Devis rénovation cuisine" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-[var(--text-2)]">Destinataire — nom</span>
          <Input name="recipient_name" maxLength={120} placeholder="Jean Dupont" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-[var(--text-2)]">Téléphone</span>
          <Input name="recipient_phone" type="tel" maxLength={40} placeholder="06 12 34 56 78" />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-[13px] text-[var(--text-2)]">E-mail</span>
          <Input name="recipient_email" type="email" maxLength={180} placeholder="jean@example.fr" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-[var(--text-2)]">Montant (€)</span>
          <Input name="amount" type="number" step="0.01" min="0" placeholder="0.00" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-[var(--text-2)]">Échéance</span>
          <Input name="due_date" type="date" />
        </label>
      </div>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Création…" : "Créer le document"}
        </button>
      </div>
    </form>
  );
}
