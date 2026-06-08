"use client";

import { useActionState } from "react";
import { sendReminderAction, type AdminFormState } from "@/lib/admin/actions";

const INITIAL: AdminFormState = { ok: false, error: null };

export function ReminderControls({
  documentId,
  hasEmail,
  hasPhone,
}: {
  documentId: string;
  hasEmail: boolean;
  hasPhone: boolean;
}) {
  const [state, formAction, pending] = useActionState(sendReminderAction, INITIAL);
  return (
    <div className="flex flex-col gap-2">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="documentId" value={documentId} />
        <button
          type="submit"
          name="channel"
          value="email"
          disabled={pending || !hasEmail}
          className="btn btn-ghost"
        >
          Relance par e-mail
        </button>
        <button
          type="submit"
          name="channel"
          value="sms"
          disabled={pending || !hasPhone}
          className="btn btn-ghost"
        >
          Relance par SMS
        </button>
      </form>
      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm" style={{ color: "var(--green)" }}>
          Relance envoyée ✓
        </p>
      )}
    </div>
  );
}
