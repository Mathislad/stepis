"use client";

import { useActionState, useState } from "react";
import { signupAction, type SignupFormState } from "@/lib/onboarding/actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

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

const SECTORS = [
  "Restaurant",
  "Artisan / Bâtiment",
  "Commerce",
  "Salon / Esthétique",
  "Services",
  "Autre",
];

const ESTIMATED_CPL = 8;

const GOALS = [
  {
    key: "acquisition",
    label: "Plus de clients via internet",
    description: "Publicité Meta + Google, page de capture, gestion des prospects.",
    icon: "🎯",
  },
  {
    key: "fidelisation",
    label: "Fidéliser mes clients existants",
    description: "Bientôt disponible — on vous prévient au lancement.",
    icon: "✦",
    locked: true,
  },
  {
    key: "both",
    label: "Les deux",
    description: "On commence par l'acquisition, on bascule sur la fidélisation au lancement.",
    icon: "🌐",
  },
];

/** Signup en 3 étapes : activité → objectif/budget → compte. */
export function SignupForm() {
  const [step, setStep] = useState(1);
  // Étape 1
  const [orgName, setOrgName] = useState("");
  const [sector, setSector] = useState(SECTORS[0]);
  const [city, setCity] = useState("");
  // Étape 2
  const [goal, setGoal] = useState<string>("acquisition");
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  // Étape 3
  const [state, formAction, pending] = useActionState(signupAction, INITIAL);

  const slug = slugify(orgName);
  const estimatedLeads = Math.round(monthlyBudget / ESTIMATED_CPL);
  // DECISION: pas de choix de formule au signup, on positionne sur "business"
  // (formule par défaut pour le pivot Acquisition — sera ajusté en mode démo
  // tant que Stripe n'est pas branché).
  const formula = "business";

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator current={step} total={3} />

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Votre activité</h2>
          <Field label="Nom de l'entreprise" required>
            <Input
              required
              maxLength={100}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Boulangerie de la Place"
            />
          </Field>
          <Field label="Secteur" required>
            <Select value={sector} onChange={(e) => setSector(e.target.value)}>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ville">
            <Input
              maxLength={80}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Roanne"
            />
          </Field>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!orgName.trim()}
            onClick={() => setStep(2)}
          >
            Continuer →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Votre objectif</h2>
          <p className="text-sm text-[var(--text-2)]">
            Que souhaitez-vous obtenir en priorité ?
          </p>
          <div className="grid gap-2">
            {GOALS.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => !g.locked && setGoal(g.key)}
                disabled={g.locked}
                className="flex items-start gap-3 rounded-lg border p-4 text-left transition-colors"
                style={{
                  background: goal === g.key ? "var(--surface-active)" : "var(--surface)",
                  borderColor: goal === g.key ? "var(--blue)" : "var(--border)",
                  opacity: g.locked ? 0.6 : 1,
                  cursor: g.locked ? "not-allowed" : "pointer",
                }}
              >
                <span className="text-2xl" aria-hidden>
                  {g.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{g.label}</p>
                    {g.locked && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                        style={{ background: "rgba(191,90,242,0.12)", color: "var(--violet)" }}
                      >
                        Bientôt
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[var(--text-2)]">{g.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="surface flex flex-col gap-2 p-4">
            <label className="flex flex-col gap-2">
              <span className="text-[13px] text-[var(--text-2)]">
                Budget mensuel publicité
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={200}
                  max={2000}
                  step={50}
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(parseInt(e.target.value, 10))}
                  className="flex-1"
                />
                <span className="w-24 shrink-0 text-right text-2xl font-semibold tabular-nums">
                  {monthlyBudget} €
                </span>
              </div>
            </label>
            <p className="text-[13px]" style={{ color: "var(--green)" }}>
              Avec ce budget, vous pouvez espérer ~
              <strong>{estimatedLeads} prospects par mois</strong>.
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              Estimation basée sur un CPL moyen de 8 €. Vous pouvez ajuster ou arrêter à tout
              moment.
            </p>
          </div>

          <div className="flex justify-between">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
              ← Retour
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>
              Continuer →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form action={formAction} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Votre compte</h2>

          {/* hidden — issu des étapes 1 et 2 */}
          <input type="hidden" name="orgName" value={orgName} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="sector" value={sector} />
          <input type="hidden" name="formula" value={formula} />

          <Field label="Votre nom">
            <Input name="fullName" placeholder="Marie Dupont" />
          </Field>
          <Field label="E-mail" required>
            <Input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="marie@boulangerie.fr"
            />
          </Field>
          <Field label="Mot de passe" required hint="8 caractères minimum">
            <Input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>

          <label className="flex items-start gap-2 text-[13px] text-[var(--text-2)]">
            <input type="checkbox" required className="mt-0.5" />
            <span>
              J&apos;accepte les{" "}
              <a href="/cgv" className="text-[var(--blue)] hover:underline">
                conditions générales
              </a>{" "}
              et la politique de confidentialité.
            </span>
          </label>

          {state.error && (
            <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
              {state.error}
            </p>
          )}

          <div className="flex justify-between">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
              ← Retour
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Création…" : "Commencer maintenant"}
            </button>
          </div>
          <p className="text-center text-[11px] text-[var(--muted)]">
            Pas de carte requise pour l&apos;essai. La facturation Stripe est en mode démo tant
            qu&apos;elle n&apos;est pas branchée.
          </p>
        </form>
      )}
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full"
          style={{
            background: i < current ? "var(--blue)" : "var(--surface-active)",
          }}
        />
      ))}
      <span className="ml-2 shrink-0 text-[12px] text-[var(--muted)]">
        Étape {current}/{total}
      </span>
    </div>
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
