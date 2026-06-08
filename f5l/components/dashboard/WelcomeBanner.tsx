import Link from "next/link";

/**
 * Bannière de bienvenue affichée au premier passage sur le dashboard si
 * l'org n'a encore aucun contact / lead / appel. Guide vers les actions
 * de démarrage les plus utiles selon les modules activés.
 */
export function WelcomeBanner({
  firstName,
  orgName,
  hasSite,
  hasCrm,
  hasLoyalty,
}: {
  firstName: string;
  orgName: string;
  hasSite: boolean;
  hasCrm: boolean;
  hasLoyalty: boolean;
}) {
  return (
    <section className="surface-glass p-6">
      <p className="text-[12px] uppercase tracking-wider text-[var(--muted)]">
        Bienvenue chez F5L
      </p>
      <h2 className="mt-1 text-xl font-semibold">
        Tout est prêt, {firstName} 👋
      </h2>
      <p className="mt-1 text-sm text-[var(--text-2)]">
        Votre équipe d&apos;employés IA est configurée pour {orgName}. Voici par où commencer :
      </p>
      <ul className="mt-4 flex flex-col gap-2 text-sm">
        {hasSite && (
          <Step n={1}>
            <Link href="/site" className="text-[var(--blue)] hover:underline">
              Personnalisez votre site
            </Link>{" "}
            — ajoutez vos horaires, vos prix, une photo.
          </Step>
        )}
        {hasCrm && (
          <Step n={hasSite ? 2 : 1}>
            <Link href="/crm/new" className="text-[var(--blue)] hover:underline">
              Ajoutez vos clients réguliers
            </Link>{" "}
            — pour les retrouver d&apos;un coup d&apos;œil.
          </Step>
        )}
        {hasLoyalty && (
          <Step n={hasSite && hasCrm ? 3 : hasSite || hasCrm ? 2 : 1}>
            <Link href="/loyalty/rewards" className="text-[var(--blue)] hover:underline">
              Configurez vos paliers fidélité
            </Link>{" "}
            — un café offert, une viennoiserie…
          </Step>
        )}
      </ul>
    </section>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-active)] text-[12px] font-semibold"
        aria-hidden
      >
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
