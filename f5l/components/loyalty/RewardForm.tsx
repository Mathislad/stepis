"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { saveRewardAction, type LoyaltyFormState } from "@/lib/loyalty/actions";
import { Input } from "@/components/ui/Input";
import type { LoyaltyRewardRow } from "@/types/database";

const INITIAL: LoyaltyFormState = { ok: false, error: null };

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-[var(--text-2)]">{label}</span>
      {children}
    </label>
  );
}

export function RewardForm({ reward }: { reward?: LoyaltyRewardRow }) {
  const [state, formAction, pending] = useActionState(saveRewardAction, INITIAL);

  return (
    <form action={formAction} className="surface flex flex-col gap-4 p-5">
      {reward && <input type="hidden" name="rewardId" value={reward.id} />}

      <Field label="Libellé">
        <Input name="label" required defaultValue={reward?.label ?? ""} placeholder="Café offert" />
      </Field>
      <Field label="Points requis">
        <Input
          name="points_required"
          type="number"
          min="1"
          required
          defaultValue={reward?.points_required?.toString() ?? ""}
          placeholder="50"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={reward?.active ?? true} />
        Actif (visible sur la carte)
      </label>

      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : reward ? "Enregistrer" : "Créer le palier"}
        </button>
      </div>
    </form>
  );
}
