import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/require-module";
import { signOut } from "@/lib/auth/actions";
import { Sidebar, type SidebarGroup, type SidebarItem } from "@/components/dashboard/Sidebar";
import { TabBar, type TabBarItem } from "@/components/dashboard/TabBar";

// DECISION: refonte F5L Acquisition. 4 sections actives (Dashboard, Prospects,
// Campagnes, Ma page), 6 modules « Bientôt », 1 section Compte.
const GROUPS: SidebarGroup[] = [
  {
    label: "F5L Acquisition",
    items: [
      { href: "/", label: "Tableau de bord", icon: "▦" },
      { href: "/prospects", label: "Mes prospects", icon: "♥" },
      { href: "/campagnes", label: "Mes campagnes", icon: "◐" },
      { href: "/ma-page", label: "Ma page", icon: "◉" },
    ],
  },
  {
    label: "Bientôt disponible",
    items: [
      { href: "/bientot/loyalty-agent", label: "Fidélisation", icon: "✦", locked: true },
      { href: "/bientot/phone", label: "Téléphone IA", icon: "☏", locked: true },
      { href: "/bientot/reputation", label: "Réputation", icon: "★", locked: true },
      { href: "/bientot/loyalty", label: "Carte fidélité", icon: "▥", locked: true },
      { href: "/bientot/admin", label: "Documents", icon: "▤", locked: true },
      { href: "/bientot/manager", label: "Manager IA", icon: "♛", locked: true },
    ],
  },
  {
    label: "Compte",
    items: [{ href: "/settings", label: "Réglages", icon: "⚙" }],
  },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const ctx = await requireAuth();

  // Tab bar mobile : Accueil + 4 onglets principaux.
  const tabItems: TabBarItem[] = [
    { href: "/", label: "Accueil", icon: "▦" },
    { href: "/prospects", label: "Prospects", icon: "♥" },
    { href: "/campagnes", label: "Campagnes", icon: "◐" },
    { href: "/ma-page", label: "Ma page", icon: "◉" },
    { href: "/settings", label: "Réglages", icon: "⚙" },
  ];

  // SidebarItem est typé pour le composant Sidebar (sans dépendance ModuleKey).
  const sidebarGroups: SidebarGroup[] = GROUPS.map((g) => ({
    label: g.label,
    items: g.items as SidebarItem[],
  }));

  return (
    <div className="f5l-shell">
      <Sidebar groups={sidebarGroups} orgName={ctx.org.name} />

      <div className="f5l-content">
        <header className="f5l-header">
          <div className="text-[12px] capitalize text-[var(--muted)]">
            Formule {ctx.formula}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[var(--text-2)] sm:inline">{ctx.email}</span>
            <form action={signOut}>
              <button type="submit" className="btn btn-ghost btn-sm">
                Déconnexion
              </button>
            </form>
          </div>
        </header>

        <main className="f5l-main">{children}</main>
      </div>

      <TabBar items={tabItems} />
    </div>
  );
}
