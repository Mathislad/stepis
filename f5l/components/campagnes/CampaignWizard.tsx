"use client";

import { useActionState, useState } from "react";
import {
  createAdCampaignAction,
  generateAdCopyAction,
  type AcquisitionFormState,
} from "@/lib/acquisition/actions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { AdObjective, AdPlatform } from "@/types/database";

const INITIAL: AcquisitionFormState = { ok: false, error: null };

const OBJECTIVES: { key: AdObjective; label: string; description: string; icon: string }[] = [
  { key: "leads", label: "Plus d'appels et de demandes", description: "Recevoir des prospects directement.", icon: "📞" },
  { key: "promo", label: "Mettre en avant une promotion", description: "Faire connaître une offre spéciale.", icon: "🎁" },
  { key: "visibility", label: "Me faire connaître", description: "Augmenter ma notoriété locale.", icon: "✨" },
];

const PLATFORMS: { key: AdPlatform; label: string; description: string; icon: string }[] = [
  { key: "meta", label: "Facebook & Instagram", description: "Meta Ads. Bon pour le visuel.", icon: "📘" },
  { key: "google", label: "Google", description: "Capter ceux qui cherchent activement.", icon: "🔎" },
  { key: "both", label: "Les deux", description: "Couverture maximale (recommandé).", icon: "🌐" },
];

const ESTIMATED_CPL = 8; // CPL estimatif pour le calcul de prospects attendus.

export function CampaignWizard() {
  const [step, setStep] = useState(1);
  const [objective, setObjective] = useState<AdObjective>("leads");
  const [platform, setPlatform] = useState<AdPlatform>("both");
  const [budgetDay, setBudgetDay] = useState(20);
  const [duration, setDuration] = useState(30);
  const [title, setTitle] = useState("");
  const [adCopy, setAdCopy] = useState("");

  const [genState, genAction, generating] = useActionState(generateAdCopyAction, INITIAL);
  const [submitState, submitAction, submitting] = useActionState(createAdCampaignAction, INITIAL);

  const totalBudget = budgetDay * duration;
  const estimatedLeads = Math.round(totalBudget / ESTIMATED_CPL);
  const currentCopy = adCopy || genState.adCopy || "";

  const goNext = () => setStep((s) => Math.min(5, s + 1));
  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator current={step} total={5} />

      {/* Étape 1 — Objectif */}
      {step === 1 && (
        <section className="surface flex flex-col gap-4 p-5">
          <h2 className="text-lg font-semibold">Que voulez-vous obtenir ?</h2>
          <div className="grid gap-2">
            {OBJECTIVES.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => {
                  setObjective(o.key);
                  goNext();
                }}
                className="flex items-start gap-3 rounded-lg border p-4 text-left transition-colors"
                style={{
                  background: objective === o.key ? "var(--surface-active)" : "var(--surface)",
                  borderColor: objective === o.key ? "var(--blue)" : "var(--border)",
                }}
              >
                <span className="text-2xl" aria-hidden>{o.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{o.label}</p>
                  <p className="text-[13px] text-[var(--text-2)]">{o.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Étape 2 — Plateforme */}
      {step === 2 && (
        <section className="surface flex flex-col gap-4 p-5">
          <h2 className="text-lg font-semibold">Où voulez-vous apparaître ?</h2>
          <div className="grid gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setPlatform(p.key);
                  goNext();
                }}
                className="flex items-start gap-3 rounded-lg border p-4 text-left transition-colors"
                style={{
                  background: platform === p.key ? "var(--surface-active)" : "var(--surface)",
                  borderColor: platform === p.key ? "var(--blue)" : "var(--border)",
                }}
              >
                <span className="text-2xl" aria-hidden>{p.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{p.label}</p>
                  <p className="text-[13px] text-[var(--text-2)]">{p.description}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={goPrev} className="btn btn-ghost">
              ← Retour
            </button>
          </div>
        </section>
      )}

      {/* Étape 3 — Budget */}
      {step === 3 && (
        <section className="surface flex flex-col gap-4 p-5">
          <h2 className="text-lg font-semibold">Quel budget ?</h2>
          <p className="text-sm text-[var(--text-2)]">
            Vous pouvez l&apos;ajuster ou arrêter à tout moment.
          </p>

          <div>
            <label className="flex flex-col gap-2">
              <span className="text-[13px] text-[var(--text-2)]">Par jour</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={1}
                  value={budgetDay}
                  onChange={(e) => setBudgetDay(parseInt(e.target.value, 10))}
                  className="flex-1"
                />
                <div className="w-24 shrink-0 text-right">
                  <span className="text-2xl font-semibold tabular-nums">{budgetDay} €</span>
                </div>
              </div>
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-[13px] text-[var(--text-2)]">Durée (jours)</span>
            <Input
              type="number"
              min={7}
              max={365}
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value, 10) || 30))}
            />
          </label>

          <div className="surface mt-1 p-4" style={{ background: "rgba(48,209,88,0.04)", borderColor: "rgba(48,209,88,0.25)" }}>
            <p className="text-[12px] uppercase tracking-wider" style={{ color: "var(--green)" }}>
              Estimation
            </p>
            <p className="mt-1 text-[15px]">
              Budget total : <strong>{totalBudget.toLocaleString("fr-FR")} €</strong>
            </p>
            <p className="text-[15px]">
              Vous pouvez espérer{" "}
              <strong style={{ color: "var(--green)" }}>~{estimatedLeads} prospects</strong>{" "}
              au total.
            </p>
            <p className="mt-2 text-[11px] text-[var(--muted)]">
              Estimation basée sur un CPL moyen de 8 € — varie selon votre secteur.
            </p>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={goPrev} className="btn btn-ghost">
              ← Retour
            </button>
            <button type="button" onClick={goNext} className="btn btn-primary">
              Continuer →
            </button>
          </div>
        </section>
      )}

      {/* Étape 4 — Texte publicitaire */}
      {step === 4 && (
        <section className="surface flex flex-col gap-4 p-5">
          <h2 className="text-lg font-semibold">Votre message</h2>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[var(--text-2)]">Titre interne</span>
            <Input
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Promo printemps 2026"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[var(--text-2)]">Texte de l&apos;annonce</span>
            <Textarea
              rows={4}
              maxLength={500}
              value={currentCopy}
              onChange={(e) => setAdCopy(e.target.value)}
              placeholder="Pas d'inspiration ? Cliquez sur « Générer par IA » ci-dessous."
            />
          </label>

          <form action={genAction}>
            <input type="hidden" name="objective" value={objective} />
            <button
              type="submit"
              disabled={generating}
              className="btn btn-ghost w-full"
              style={{ borderStyle: "dashed" }}
            >
              {generating ? "Génération…" : "✨ Générer par IA"}
            </button>
            {genState.error && (
              <p className="mt-1 text-[12px]" style={{ color: "var(--red)" }}>
                {genState.error}
              </p>
            )}
          </form>

          {/* Aperçu visuel */}
          {currentCopy && (
            <div className="rounded-lg border border-[var(--border)] bg-white p-4 text-black">
              <p className="text-[10px] font-semibold uppercase text-gray-500">
                Aperçu de votre annonce
              </p>
              <p className="mt-1 text-sm">{currentCopy}</p>
            </div>
          )}

          <div className="flex justify-between">
            <button type="button" onClick={goPrev} className="btn btn-ghost">
              ← Retour
            </button>
            <button type="button" onClick={goNext} className="btn btn-primary" disabled={!title || !currentCopy}>
              Continuer →
            </button>
          </div>
        </section>
      )}

      {/* Étape 5 — Récap + soumission */}
      {step === 5 && (
        <section className="surface flex flex-col gap-4 p-5">
          <h2 className="text-lg font-semibold">Récapitulatif</h2>
          <ul className="flex flex-col gap-2 text-sm">
            <Row label="Objectif" value={OBJECTIVES.find((o) => o.key === objective)?.label ?? ""} />
            <Row label="Plateforme" value={PLATFORMS.find((p) => p.key === platform)?.label ?? ""} />
            <Row label="Budget total" value={`${totalBudget.toLocaleString("fr-FR")} € sur ${duration} j`} />
            <Row label="Estimation prospects" value={`~${estimatedLeads}`} />
            <Row label="Texte" value={currentCopy} />
          </ul>

          <form action={submitAction}>
            <input type="hidden" name="objective" value={objective} />
            <input type="hidden" name="platform" value={platform} />
            <input type="hidden" name="budget" value={totalBudget.toString()} />
            <input type="hidden" name="duration_days" value={duration.toString()} />
            <input type="hidden" name="title" value={title} />
            <input type="hidden" name="ad_copy" value={currentCopy} />

            {submitState.error && (
              <p className="mb-2 text-sm" style={{ color: "var(--red)" }} role="alert">
                {submitState.error}
              </p>
            )}

            <div className="flex justify-between">
              <button type="button" onClick={goPrev} className="btn btn-ghost">
                ← Retour
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Lancement…" : "Lancer ma campagne"}
              </button>
            </div>
          </form>

          <p className="text-[11px] text-[var(--muted)]">
            La campagne sera créée en brouillon. Elle ne dépense rien tant que vous ne l&apos;activez pas.
          </p>
        </section>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-2 last:border-0">
      <span className="shrink-0 text-[var(--text-2)]">{label}</span>
      <span className="text-right">{value || "—"}</span>
    </li>
  );
}
