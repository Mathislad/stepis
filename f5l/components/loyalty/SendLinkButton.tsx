"use client";

import { useActionState } from "react";
import { sendCardLinkAction, type LoyaltyFormState } from "@/lib/loyalty/actions";

const INITIAL: LoyaltyFormState = { ok: false, error: null };

/** Bouton « Envoyer le lien » (Brevo) avec retour visuel. */
export function SendLinkButton({
  cardId,
  className,
}: {
  cardId: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(sendCardLinkAction, INITIAL);
  return (
    <form action={formAction} className="inline-flex flex-col items-end gap-0.5">
      <input type="hidden" name="cardId" value={cardId} />
      <button
        type="submit"
        disabled={pending}
        className={className ?? "btn btn-ghost px-3 py-1.5 text-[13px]"}
      >
        {pending ? "Envoi…" : state.ok ? "Envoyé ✓" : "Envoyer le lien"}
      </button>
      {state.error && (
        <span className="text-[11px]" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </span>
      )}
    </form>
  );
}
