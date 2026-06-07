import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/require-module";
import { signOut } from "@/lib/auth/actions";
import { Sidebar, type SidebarGroup, type SidebarItem } from "@/components/dashboard/Sidebar";
import { TabBar, type TabBarItem } from "@/components/dashboard/TabBar";
import type { ModuleKey } from "@/types/database";

// DECISION: regroupement Apple-style des modules en 4 catégories visibles
// dans la sidebar. Le tableau de bord est en tête, puis les groupes.
const GROUP_TEMPLATE: { label: string; items: SidebarItem[] }[] = [
  {
    label: "Votre activité",
    items: [
      { href: "/", label: "Tableau de bord", icon: "▦" },
      { href: "/crm", label: "Mes clients", icon: "♥", module: "crm" },
      { href: "/site", label: "Mon site", icon: "◉", module: "site" },
    ],
  },
  {
    label: "Automatisation",
    items: [
      { href: "/loyalty-agent", label: "Fidélisation", icon: "✦", module: "loyalty_agent" },
      { href: "/acquisition", label: "Publicité", icon: "◐", module: "acquisition" },
      { href: "/telephone", label: "Téléphone", icon: "☏", module: "phone" },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: "/admin", label: "Mes documents", icon: "▤", module: "admin" },
      { href: "/manager", label: "Manager", icon: "♛", module: "manager" },
      { href: "/reputation", label: "Réputation", icon: "★", module: "reputation" },
    ],
  },
  {
    label: "Outils",
    items: [{ href: "/loyalty", label: "Carte fidélité", icon: "▥", module: "loyalty_card" }],
  },
  {
    label: "Compte",
    items: [{ href: "/settings", label: "Réglages", icon: "⚙" }],
  },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const ctx = await requireAuth();

  // Filtre les items selon les modules activés. Le Tableau de bord est toujours visible.
  const groups: SidebarGroup[] = GROUP_TEMPLATE.map((g) => ({
    label: g.label,
    items: g.items.filter((item) => !item.module || ctx.enabledModules.has(item.module as ModuleKey)),
  })).filter((g) => g.items.length > 0);

  // Tab bar mobile : 5 onglets principaux (Accueil + 4 modules clés selon ce qui est activé).
  const allItems: SidebarItem[] = groups.flatMap((g) => g.items);
  const tabItems: TabBarItem[] = allItems.slice(0, 5).map((it) => ({
    href: it.href,
    label: it.label.length > 9 ? it.label.split(" ")[0] : it.label,
    icon: it.icon,
  }));

  return (
    <div className="f5l-shell">
      <Sidebar groups={groups} orgName={ctx.org.name} />

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
