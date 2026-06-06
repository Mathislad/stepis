"use client";

import { useActionState, useEffect, useState } from "react";
import { captureLeadAction, type LeadFormState } from "@/lib/site/actions";

const INITIAL: LeadFormState = { ok: false, error: null };

const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-zinc-900";

export function LeadForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState(captureLeadAction, INITIAL);
  const [sourceUrl, setSourceUrl] = useState("");

  useEffect(() => {
    setSourceUrl(window.location.href);
  }, []);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
        Votre message a bien été envoyé, nous vous répondons très vite ! 🎉
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="sourceUrl" value={sourceUrl} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Nom *</span>
          <input name="name" required className={inputCls} placeholder="Votre nom" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Téléphone *</span>
          <input name="phone" required className={inputCls} placeholder="06 12 34 56 78" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600">E-mail</span>
        <input name="email" type="email" className={inputCls} placeholder="vous@email.fr" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600">Message</span>
        <textarea name="message" rows={4} className={inputCls} placeholder="Votre message…" />
      </label>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}
