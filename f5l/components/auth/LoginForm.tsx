"use client";

import { useActionState } from "react";
import { signIn, type AuthFormState } from "@/lib/auth/actions";
import { Input } from "@/components/ui/Input";

const INITIAL: AuthFormState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm text-[var(--text-2)]">
          E-mail
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="vous@commerce.fr"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm text-[var(--text-2)]">
          Mot de passe
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="text-sm text-[var(--red)]" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary mt-1" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
