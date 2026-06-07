"use client";

import { useActionState } from "react";
import { saveOrgSettingsAction, type SettingsFormState } from "@/lib/settings/actions";
import { Input } from "@/components/ui/Input";
import type { OrganizationRow } from "@/types/database";

const INITIAL: SettingsFormState = { ok: false, error: null };

export function OrgSettingsForm({ org }: { org: OrganizationRow }) {
  const [state, formAction, pending] = useActionState(saveOrgSettingsAction, INITIAL);
  return (
    <form action={formAction} className="surface flex flex-col gap-4 p-5">
      <Field label="Nom du commerce" required>
        <Input name="name" required maxLength={100} defaultValue={org.name} />
      </Field>

      <Field label="Identifiant du site public" hint={`Votre site : f5l.app/p/${org.slug}`}>
        <Input value={org.slug} readOnly disabled />
        <span className="text-[11px] text-[var(--muted)]">
          L&apos;identifiant ne peut pas être modifié pour l&apos;instant (impact sur l&apos;URL publique).
        </span>
      </Field>

      <Field label="Secteur d'activité">
        <Input name="sector" maxLength={60} defaultValue={org.sector ?? ""} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Téléphone de contact" hint="Pour recevoir les notifications de nouveau lead">
          <Input name="contact_phone" type="tel" maxLength={40} defaultValue={org.contact_phone ?? ""} />
        </Field>
        <Field label="E-mail de contact">
          <Input name="contact_email" type="email" maxLength={180} defaultValue={org.contact_email ?? ""} />
        </Field>
      </div>

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

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-[var(--text-2)]">
        {label}
        {required && " *"}
      </span>
      {children}
      {hint && <span className="text-[11px] text-[var(--muted)]">{hint}</span>}
    </label>
  );
}
