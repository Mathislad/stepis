"use client";

import { useEffect } from "react";

/**
 * Error boundary global. Capture les erreurs non gérées et propose un retry
 * ou un retour à l'accueil.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // QA-FIX: trace l'erreur pour faciliter le debug en prod (Sentry à brancher).
    console.error("[F5L:error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="surface w-full max-w-md p-7 text-center">
        <p className="text-3xl">⚠</p>
        <h1 className="mt-2 text-xl font-semibold">Une erreur s&apos;est produite</h1>
        <p className="mt-2 text-sm text-[var(--text-2)]">
          Nous n&apos;avons pas pu charger cette page. Réessayez ou revenez à l&apos;accueil.
        </p>
        {error.digest && (
          <p className="mt-2 text-[11px] text-[var(--muted)]">Référence : {error.digest}</p>
        )}
        <div className="mt-5 flex justify-center gap-2">
          <button onClick={reset} className="btn btn-primary">
            Réessayer
          </button>
          <a href="/" className="btn btn-ghost">
            Accueil
          </a>
        </div>
      </div>
    </main>
  );
}
