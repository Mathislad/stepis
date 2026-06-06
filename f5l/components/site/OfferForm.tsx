"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { saveOfferAction, type SiteFormState } from "@/lib/site/actions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { OfferRow } from "@/types/database";

const INITIAL: SiteFormState = { ok: false, error: null };

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

export function OfferForm({ offer }: { offer?: OfferRow }) {
  const [state, formAction, pending] = useActionState(saveOfferAction, INITIAL);

  return (
    <form action={formAction} className="surface flex flex-col gap-4 p-5">
      {offer && <input type="hidden" name="offerId" value={offer.id} />}

      <Field label="Titre" required>
        <Input name="title" required defaultValue={offer?.title ?? ""} placeholder="Offre de bienvenue" />
      </Field>
      <Field label="Description">
        <Textarea name="description" defaultValue={offer?.description ?? ""} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Remise">
          <Input name="discount" defaultValue={offer?.discount ?? ""} placeholder="-15%" />
        </Field>
        <Field label="Valable du">
          <Input name="valid_from" type="date" defaultValue={offer?.valid_from ?? ""} />
        </Field>
        <Field label="Jusqu'au">
          <Input name="valid_until" type="date" defaultValue={offer?.valid_until ?? ""} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={offer?.active ?? true} />
        Active (visible sur le site)
      </label>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : offer ? "Enregistrer" : "Créer l'offre"}
        </button>
      </div>
    </form>
  );
}
