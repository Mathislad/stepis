import Link from "next/link";

interface Props {
  activeCampaigns: number;
  prospectsThisMonth: number;
}

/**
 * Checklist d'onboarding affichée tant que l'utilisateur n'a pas reçu son
 * premier prospect. Trois étapes : compléter la page, lancer une campagne,
 * recevoir un prospect. Les deux premières sont cliquables, la dernière se
 * coche automatiquement.
 */
export function OnboardingChecklist({ activeCampaigns, prospectsThisMonth }: Props) {
  const step2Done = activeCampaigns > 0;
  const step3Done = prospectsThisMonth > 0;
  // L'étape 1 (compléter la page) ne peut pas être détectée serveur trivialement
  // sans charger les blocs ; on la marque comme « faite » dès qu'une campagne
  // est active (pré-requis usuel pour lancer une pub).
  const step1Done = step2Done;

  return (
    <section className="surface-glass p-6">
      <p className="text-[12px] uppercase tracking-wider text-[var(--blue)]">
        🎯 Démarrage
      </p>
      <h2 className="mt-1 text-xl font-semibold">
        Lancez votre 1er prospect en 3 étapes
      </h2>
      <p className="mt-1 text-sm text-[var(--text-2)]">Temps estimé : 15 minutes.</p>

      <ul className="mt-4 flex flex-col gap-2.5 text-sm">
        <Step n={1} done={step1Done} href="/ma-page" label="Complétez votre page" />
        <Step
          n={2}
          done={step2Done}
          href="/campagnes/nouvelle"
          label="Lancez votre 1re campagne"
        />
        <Step
          n={3}
          done={step3Done}
          label="Recevez votre 1er prospect (automatique)"
          autoOnly
        />
      </ul>
    </section>
  );
}

function Step({
  n,
  done,
  href,
  label,
  autoOnly = false,
}: {
  n: number;
  done: boolean;
  href?: string;
  label: string;
  autoOnly?: boolean;
}) {
  const inner = (
    <span className="flex items-center gap-3">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
        style={
          done
            ? { background: "var(--green)", color: "#fff" }
            : { background: "var(--surface-active)", color: "var(--text-2)" }
        }
        aria-hidden
      >
        {done ? "✓" : n}
      </span>
      <span
        style={done ? { color: "var(--muted)", textDecoration: "line-through" } : undefined}
      >
        {label}
      </span>
    </span>
  );
  if (autoOnly || done || !href) return <li>{inner}</li>;
  return (
    <li>
      <Link href={href} className="hover:underline">
        {inner}
      </Link>
    </li>
  );
}
