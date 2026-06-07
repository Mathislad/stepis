import Link from "next/link";

export const metadata = { title: "Page introuvable — F5L" };

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="surface w-full max-w-md p-7 text-center">
        <p className="text-3xl">🔍</p>
        <h1 className="mt-2 text-xl font-semibold">Page introuvable</h1>
        <p className="mt-2 text-sm text-[var(--text-2)]">
          La page demandée n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Link href="/" className="btn btn-primary mt-5 inline-flex">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
