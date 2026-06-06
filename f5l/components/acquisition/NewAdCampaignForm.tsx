"use client";

import { useActionState, useState } from "react";
import {
  createAdCampaignAction,
  generateAdCopyAction,
  type AcquisitionFormState,
} from "@/lib/acquisition/actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { OBJECTIVE_LABELS, PLATFORM_LABELS } from "@/lib/acquisition/labels";
import type { AdObjective, AdPlatform } from "@/types/database";

const INITIAL: AcquisitionFormState = { ok: false, error: null };

export function NewAdCampaignForm() {
  const [submitState, submitAction, submitting] = useActionState(createAdCampaignAction, INITIAL);
  const [genState, genAction, generating] = useActionState(generateAdCopyAction, INITIAL);
  const [objective, setObjective] = useState<AdObjective>("leads");
  const [adCopy, setAdCopy] = useState<string>("");

  // Si l'IA a généré, on récupère son retour pour préremplir le textarea.
  const generatedCopy = genState.adCopy ?? null;
  const currentCopy = adCopy || generatedCopy || "";

  return (
    <div className="flex flex-col gap-4">
      <form action={submitAction} className="surface flex flex-col gap-4 p-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-[var(--text-2)]">Titre</span>
          <Input name="title" required maxLength={200} placeholder="Promo printemps 2026" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[var(--text-2)]">Objectif</span>
            <Select
              name="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value as AdObjective)}
            >
              {(Object.entries(OBJECTIVE_LABELS) as [AdObjective, string][]).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[var(--text-2)]">Plateforme</span>
            <Select name="platform" defaultValue="both">
              {(Object.entries(PLATFORM_LABELS) as [AdPlatform, string][]).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[var(--text-2)]">Budget (€)</span>
            <Input name="budget" type="number" step="1" min="0" defaultValue="100" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[var(--text-2)]">Durée (jours)</span>
            <Input name="duration_days" type="number" min="1" defaultValue="30" />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-[var(--text-2)]">Texte publicitaire</span>
          <Textarea
            name="ad_copy"
            rows={3}
            value={currentCopy}
            onChange={(e) => setAdCopy(e.target.value)}
            placeholder="Votre texte ou utilisez l'IA pour le générer"
          />
        </label>

        {submitState.error && (
          <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
            {submitState.error}
          </p>
        )}

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Création…" : "Créer la campagne"}
          </button>
        </div>
      </form>

      {/* Formulaire séparé pour la génération IA (sinon le submit principal partirait) */}
      <form action={genAction} className="surface flex items-center justify-between gap-3 p-4">
        <input type="hidden" name="objective" value={objective} />
        <p className="text-sm text-[var(--text-2)]">
          Pas d&apos;inspiration ? L&apos;IA peut générer un texte selon votre objectif.
        </p>
        <button type="submit" className="btn btn-ghost" disabled={generating}>
          {generating ? "Génération…" : "✨ Générer par IA"}
        </button>
      </form>
      {genState.error && (
        <p className="text-sm" style={{ color: "var(--red)" }}>
          {genState.error}
        </p>
      )}
    </div>
  );
}
