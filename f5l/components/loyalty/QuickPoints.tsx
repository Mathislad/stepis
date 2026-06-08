"use client";

import { useActionState } from "react";
import { addPointsAction, type LoyaltyFormState } from "@/lib/loyalty/actions";
import { Input } from "@/components/ui/Input";

const INITIAL: LoyaltyFormState = { ok: false, error: null };

/** Crédit/débit rapide depuis la liste : montant + boutons + / −. */
export function QuickPoints({ cardId }: { cardId: string }) {
  const [, formAction, pending] = useActionState(addPointsAction, INITIAL);
  return (
    <form action={formAction} className="flex items-center gap-1">
      <input type="hidden" name="cardId" value={cardId} />
      <Input
        name="amount"
        type="number"
        min="1"
        defaultValue="10"
        aria-label="Nombre de points"
        className="text-[13px]"
        style={{ width: "62px", padding: "6px 8px" }}
      />
      <button
        type="submit"
        name="reason"
        value="earn"
        disabled={pending}
        aria-label="Créditer des points"
        className="btn btn-ghost px-2.5 py-1.5 text-[13px]"
      >
        +
      </button>
      <button
        type="submit"
        name="reason"
        value="redeem"
        disabled={pending}
        aria-label="Débiter des points"
        className="btn btn-ghost px-2.5 py-1.5 text-[13px]"
      >
        −
      </button>
    </form>
  );
}
