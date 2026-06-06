"use client";

import { useActionState } from "react";
import { requestSignatureAction, type AdminFormState } from "@/lib/admin/actions";

const INITIAL: AdminFormState = { ok: false, error: null };

export function SignatureControl({ documentId }: { documentId: string }) {
  const [state, formAction, pending] = useActionState(requestSignatureAction, INITIAL);
  return (
    <form action={formAction} className="inline-flex flex-col gap-1">
      <input type="hidden" name="documentId" value={documentId} />
      <button type="submit" className="btn btn-ghost" disabled={pending}>
        {pending ? "Envoi…" : state.ok ? "Demande envoyée ✓" : "Envoyer pour signature"}
      </button>
      {state.error && (
        <span className="text-[11px]" style={{ color: "var(--amber)" }}>
          {state.error}
        </span>
      )}
    </form>
  );
}
