import { getOrgContext } from "@/lib/auth/context";
import { MODULE_LIST } from "@/lib/modules";

/**
 * Accueil du tableau de bord. Démontre la fondation : contexte tenant résolu
 * via `getOrgContext()` + état d'activation des modules (placeholder UI).
 * Les modules eux-mêmes seront branchés aux étapes suivantes.
 */
export default async function DashboardHome() {
  // Non-null : le layout a déjà appelé requireAuth().
  const ctx = (await getOrgContext())!;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-semibold">Bonjour 👋</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          Voici l&apos;état de votre équipe d&apos;employés IA pour{" "}
          <span className="text-[var(--text)]">{ctx.org.name}</span>.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--text-2)]">Modules</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MODULE_LIST.map((mod) => {
            const enabled = ctx.enabledModules.has(mod.key);
            return (
              <div
                key={mod.key}
                className="surface surface-hover flex items-start justify-between gap-4 p-4"
              >
                <div>
                  <p className="font-medium">{mod.label}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-2)]">
                    {mod.description}
                  </p>
                </div>
                {enabled ? (
                  <span className="badge badge-green shrink-0">Activé</span>
                ) : (
                  <span className="badge badge-muted shrink-0">
                    {mod.available ? "Verrouillé" : "Bientôt"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-[var(--muted)]">
        Fondation Étape 1 — les écrans des modules seront ajoutés ensuite.
      </p>
    </div>
  );
}
