import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Connexion — F5L" };

export default function LoginPage() {
  return (
    <div className="surface p-7">
      <div className="mb-6">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--blue)] text-lg font-bold text-white">
          F
        </div>
        <h1 className="text-xl font-semibold">Console F5L</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          Connectez-vous pour piloter votre équipe d&apos;employés IA.
        </p>
      </div>
      <LoginForm />
      <p className="mt-5 text-center text-sm text-[var(--text-2)]">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="text-[var(--blue)] hover:underline">
          Créer mon compte
        </Link>
      </p>
    </div>
  );
}
