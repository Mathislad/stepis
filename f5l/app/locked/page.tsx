import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-module";
import { MODULE_BY_KEY } from "@/lib/modules";
import type { ModuleKey } from "@/types/database";

/** Écran « module verrouillé » — cible des redirections de `requireModule()`. */
export default async function LockedPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string }>;
}) {
  await requireAuth();
  const { module } = await searchParams;
  const meta = module ? MODULE_BY_KEY[module as ModuleKey] : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="surface w-full max-w-md p-7 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-strong)] text-2xl">
          🔒
        </div>
        <h1 className="text-xl font-semibold">
          {meta ? `Module « ${meta.label} » verrouillé` : "Module verrouillé"}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-2)]">
          {meta?.available === false
            ? "Ce module arrive prochainement."
            : "Ce module n'est pas inclus dans votre formule actuelle."}
        </p>
        <Link href="/" className="btn btn-primary mt-6 inline-flex">
          Retour au tableau de bord
        </Link>
      </div>
    </main>
  );
}
