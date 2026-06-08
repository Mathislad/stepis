"use client";

import { useActionState } from "react";
import { captureLeadAction, type LeadFormState } from "@/lib/site/actions";

const INITIAL: LeadFormState = { ok: false, error: null };

const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export function LeadForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState(captureLeadAction, INITIAL);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-2xl">🎉</p>
        <p className="mt-2 text-lg font-semibold text-emerald-900">Bien reçu !</p>
        <p className="mt-1 text-emerald-700">
          Nous vous répondons très vite.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="slug" value={slug} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700">Votre nom *</span>
          <input name="name" required maxLength={120} className={inputCls} placeholder="Jean Dupont" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700">Téléphone *</span>
          <input name="phone" required maxLength={40} className={inputCls} placeholder="06 12 34 56 78" />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-700">E-mail (optionnel)</span>
        <input name="email" type="email" maxLength={180} className={inputCls} placeholder="jean@email.fr" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-700">Votre message</span>
        <textarea
          name="message"
          rows={4}
          maxLength={1200}
          className={inputCls}
          placeholder="Quelques mots sur votre besoin…"
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
        className="rounded-lg bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Envoyer ma demande"}
      </button>
      <p className="text-center text-xs text-zinc-400">
        Nous ne partagerons jamais vos coordonnées.
      </p>
    </form>
  );
}
