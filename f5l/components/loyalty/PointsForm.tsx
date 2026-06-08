"use client";

import { useActionState, useEffect, useRef } from "react";
import { addPointsAction, type LoyaltyFormState } from "@/lib/loyalty/actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const INITIAL: LoyaltyFormState = { ok: false, error: null };

/** Formulaire complet de gestion des points (fiche carte). */
export function PointsForm({ cardId }: { cardId: string }) {
  const [state, formAction, pending] = useActionState(addPointsAction, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="surface flex flex-col gap-3 p-4">
      <input type="hidden" name="cardId" value={cardId} />
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-[13px] text-[var(--text-2)]">Points</span>
          <Input name="amount" type="number" defaultValue="10" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-[var(--text-2)]">Raison</span>
          <Select name="reason" defaultValue="earn" style={{ width: "auto" }}>
            <option value="earn">Gain</option>
            <option value="redeem">Rachat</option>
            <option value="adjust">Ajustement</option>
          </Select>
        </label>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "…" : "Appliquer"}
        </button>
      </div>
      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm" style={{ color: "var(--green)" }}>
          Solde mis à jour ✓
        </p>
      )}
    </form>
  );
}
