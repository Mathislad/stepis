"use client";

import { useActionState } from "react";
import {
  saveLandingPageAction,
  type LandingFormState,
} from "@/lib/landing-page/actions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { LandingPage } from "@/lib/landing-page/page";

const INITIAL: LandingFormState = { ok: false, error: null };

export function LandingPageEditor({
  page,
  publicUrl,
}: {
  page: LandingPage;
  publicUrl: string;
}) {
  const [state, formAction, pending] = useActionState(saveLandingPageAction, INITIAL);
  const heroDef = page.hero;
  const servicesPadded = padArray(page.services, 6, { title: "", description: "" });
  const testimonialsPadded = padArray(page.testimonials, 3, { author: "", quote: "" });
  const hours = page.hours ?? {
    days: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map(
      (label) => ({ label, open: "09:00", close: "18:00", closed: false }),
    ),
  };

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Hero */}
      <Section title="En-tête principal" hint="La première chose que voient vos visiteurs.">
        <Field label="Titre accrocheur">
          <Input name="hero_title" maxLength={120} defaultValue={heroDef.title} placeholder="La meilleure boulangerie de Roanne" />
        </Field>
        <Field label="Sous-titre">
          <Textarea
            name="hero_subtitle"
            maxLength={300}
            rows={2}
            defaultValue={heroDef.subtitle}
            placeholder="Pain frais cuit sur place, viennoiseries maison, accueil chaleureux."
          />
        </Field>
        <Field label="Texte du bouton">
          <Input name="hero_cta" maxLength={40} defaultValue={heroDef.ctaLabel} placeholder="Nous contacter" />
        </Field>
      </Section>

      {/* Services */}
      <Section title="Vos services / prestations" hint="3 à 6 services proposés. Laissez vide ceux que vous ne voulez pas afficher.">
        <div className="grid gap-3 sm:grid-cols-2">
          {servicesPadded.map((s, i) => (
            <div key={i} className="surface flex flex-col gap-2 p-3">
              <p className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                Service {i + 1}
              </p>
              <Input
                name={`service_${i}_title`}
                maxLength={80}
                defaultValue={s.title}
                placeholder="Ex : Baguette tradition"
              />
              <Textarea
                name={`service_${i}_description`}
                maxLength={200}
                rows={2}
                defaultValue={s.description}
                placeholder="Description courte"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Témoignages */}
      <Section title="Témoignages clients" hint="Optionnels — 0 à 3 avis. Masqués si vides.">
        <div className="grid gap-3">
          {testimonialsPadded.map((t, i) => (
            <div key={i} className="surface flex flex-col gap-2 p-3">
              <Textarea
                name={`testimonial_${i}_quote`}
                maxLength={300}
                rows={2}
                defaultValue={t.quote}
                placeholder="« Excellente boulangerie, le pain est délicieux ! »"
              />
              <Input
                name={`testimonial_${i}_author`}
                maxLength={80}
                defaultValue={t.author}
                placeholder="Prénom du client"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Horaires */}
      <Section title="Horaires d'ouverture">
        <div className="flex flex-col gap-2">
          {hours.days.map((d, i) => (
            <div key={d.label} className="flex items-center gap-2">
              <span className="w-24 text-sm">{d.label}</span>
              <Input
                name={`day_${i}_open`}
                type="time"
                defaultValue={d.open}
                style={{ width: "auto" }}
              />
              <span className="text-[var(--muted)]">–</span>
              <Input
                name={`day_${i}_close`}
                type="time"
                defaultValue={d.close}
                style={{ width: "auto" }}
              />
              <label className="ml-auto flex items-center gap-1.5 text-[13px] text-[var(--text-2)]">
                <input type="checkbox" name={`day_${i}_closed`} defaultChecked={d.closed} />
                Fermé
              </label>
            </div>
          ))}
        </div>
      </Section>

      {/* Infos */}
      <Section title="Informations pratiques">
        <Field label="Adresse">
          <Input name="info_address" maxLength={200} defaultValue={page.info.address} placeholder="12 rue de la République" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ville">
            <Input name="info_city" maxLength={100} defaultValue={page.info.city} placeholder="Roanne" />
          </Field>
          <Field label="Téléphone">
            <Input
              name="info_phone"
              type="tel"
              maxLength={40}
              defaultValue={page.info.phone}
              placeholder="04 77 XX XX XX"
            />
          </Field>
        </div>
      </Section>

      {/* Publication */}
      <section className="surface flex items-center justify-between gap-3 p-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="published"
            defaultChecked={page.published}
            className="h-5 w-5"
          />
          <div>
            <p className="font-medium">Page visible en ligne</p>
            <p className="text-[12px] text-[var(--text-2)]">
              {publicUrl}
            </p>
          </div>
        </label>
        <a href={publicUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
          Aperçu ↗
        </a>
      </section>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm" style={{ color: "var(--green)" }}>
          Page enregistrée ✓
        </p>
      )}

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[var(--border)] bg-[var(--bg)] py-3 backdrop-blur">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : "Publier les modifications"}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface flex flex-col gap-3 p-5">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {hint && <p className="text-[12px] text-[var(--text-2)]">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-[var(--text-2)]">{label}</span>
      {children}
    </label>
  );
}

function padArray<T>(arr: T[], length: number, filler: T): T[] {
  const out = [...arr];
  while (out.length < length) out.push(filler);
  return out.slice(0, length);
}
