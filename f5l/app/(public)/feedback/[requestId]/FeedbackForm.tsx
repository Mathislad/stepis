"use client";

import { useActionState } from "react";
import {
  submitPrivateFeedbackAction,
  type FeedbackFormState,
} from "@/lib/reputation/public-actions";

const INITIAL: FeedbackFormState = { ok: false, error: null };

export function FeedbackForm({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(
    submitPrivateFeedbackAction,
    INITIAL,
  );

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
        Merci, votre retour a bien été transmis.
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="requestId" value={requestId} />

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-700">Votre note</span>
        <select
          name="rating"
          required
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
          defaultValue="5"
        >
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Très bien</option>
          <option value="3">3 - Correct</option>
          <option value="2">2 - À améliorer</option>
          <option value="1">1 - Mauvaise expérience</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-700">Message privé</span>
        <textarea
          name="message"
          rows={5}
          maxLength={1200}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
          placeholder="Dites-nous ce qui s'est bien passé ou ce que nous pouvons améliorer."
        />
      </label>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Envoyer mon retour"}
      </button>
    </form>
  );
}
