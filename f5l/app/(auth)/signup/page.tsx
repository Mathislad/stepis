import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "Créer un compte — F5L" };

export default function SignupPage() {
  return (
    <div className="surface p-7">
      <div className="mb-6">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--blue)] text-lg font-bold text-white">
          F
        </div>
        <h1 className="text-xl font-semibold">Créer un compte F5L</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          Votre équipe d&apos;employés IA, prête en 2 minutes.
        </p>
      </div>
      <SignupForm />
      <p className="mt-5 text-center text-sm text-[var(--text-2)]">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-[var(--blue)] hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
