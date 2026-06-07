"use client";

import { useActionState, useState } from "react";
import { signupAction, type SignupFormState } from "@/lib/onboarding/actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FORMULA_PLANS, FORMULA_ORDER } from "@/lib/billing/formulas";
import type { Formula } from "@/types/database";

const INITIAL: SignupFormState = { ok: false, error: null };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, INITIAL);
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [formula, setFormula] = useState<Formula>("business");

  const onOrgNameChange = (v: string) => {
    setOrgName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Votre nom">
        <Input name="fullName" placeholder="Marie Dupont" />
      </Field>

      <Field label="E-mail" required>
        <Input name="email" type="email" required autoComplete="email" placeholder="marie@boulangerie.fr" />
      </Field>

      <Field label="Mot de passe" required hint="8 caractères minimum">
        <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
      </Field>

      <Field label="Nom du commerce" required>
        <Input
          name="orgName"
          required
          maxLength={100}
          value={orgName}
          onChange={(e) => onOrgNameChange(e.target.value)}
          placeholder="Boulangerie de la Place"
        />
      </Field>

      <Field
        label="Identifiant de votre site public"
        required
        hint={slug ? `Votre site : f5l.app/p/${slug}` : "Sera utilisé dans l'URL : f5l.app/p/votre-identifiant"}
      >
        <Input
          name="slug"
          required
          maxLength={50}
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          placeholder="ma-boulangerie"
        />
      </Field>

      <Field label="Secteur (optionnel)">
        <Input name="sector" maxLength={60} placeholder="Boulangerie, fleuriste, coiffeur…" />
      </Field>

      <Field label="Formule">
        <Select name="formula" value={formula} onChange={(e) => setFormula(e.target.value as Formula)}>
          {FORMULA_ORDER.map((k) => {
            const p = FORMULA_PLANS[k];
            return (
              <option key={k} value={k}>
                {p.label} — {p.priceMonthlyEur} €/mois
              </option>
            );
          })}
        </Select>
        <p className="mt-1 text-[12px] text-[var(--text-2)]">
          {FORMULA_PLANS[formula].description}
        </p>
      </Field>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary mt-2" disabled={pending}>
        {pending ? "Création…" : "Créer mon compte"}
      </button>
      <p className="text-center text-[11px] text-[var(--muted)]">
        La facturation Stripe est en mode démo tant que la clé n&apos;est pas branchée.
      </p>
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
      <span className="text-sm text-[var(--text-2)]">
        {label}
        {required && " *"}
      </span>
      {children}
      {hint && <span className="text-[11px] text-[var(--muted)]">{hint}</span>}
    </label>
  );
}
