import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/require-module";
import { signOut } from "@/lib/auth/actions";
import { NavLinks, type NavItem } from "@/components/dashboard/NavLinks";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Garde serveur (le middleware protège déjà, ceci fournit le contexte).
  const ctx = await requireAuth();

  // Navigation construite côté serveur depuis les modules activés de l'org.
  const navItems: NavItem[] = [{ href: "/", label: "Tableau de bord" }];
  if (ctx.enabledModules.has("crm")) navItems.push({ href: "/crm", label: "CRM" });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--blue)] text-sm font-bold text-white">
                F
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">{ctx.org.name}</p>
                <p className="text-xs capitalize text-[var(--muted)]">
                  Formule {ctx.formula}
                </p>
              </div>
            </div>
            <div className="hidden sm:block">
              <NavLinks items={navItems} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[var(--text-2)] sm:inline">
              {ctx.email}
            </span>
            <form action={signOut}>
              <button type="submit" className="btn btn-ghost px-3 py-1.5 text-[13px]">
                Déconnexion
              </button>
            </form>
          </div>
        </div>

        {/* Navigation mobile (le desktop l'affiche dans la barre ci-dessus) */}
        <div className="border-t border-[var(--border)] px-3 py-1.5 sm:hidden">
          <NavLinks items={navItems} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
