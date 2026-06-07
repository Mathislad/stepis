"use client";

import { useActionState } from "react";
import { startCheckoutAction, type BillingFormState } from "@/lib/billing/actions";
import type { Formula } from "@/types/database";

const INITIAL: BillingFormState = { ok: false, error: null };

export function BillingActions({ formula }: { formula: Formula }) {
  const [state, formAction, pending] = useActionState(startCheckoutAction, INITIAL);
  return (
    <form action={formAction} className="mt-auto flex flex-col gap-2">
      <input type="hidden" name="formula" value={formula} />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Redirection…" : "Choisir cette formule"}
      </button>
      {state.error && (
        <p className="text-[11px]" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="text-[11px]" style={{ color: "var(--amber)" }}>
          {state.message}
        </p>
      )}
    </form>
  );
}
