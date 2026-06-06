"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ModuleKey } from "@/types/database";

export interface SidebarItem {
  href: string;
  label: string;
  icon: string;
  module?: ModuleKey;
}

export interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

/**
 * Sidebar dashboard avec groupes thématiques et lien actif (barre bleue).
 * `aria-current="page"` est posé sur l'item dont le pathname correspond.
 */
export function Sidebar({
  groups,
  orgName,
}: {
  groups: SidebarGroup[];
  orgName: string;
}) {
  const pathname = usePathname() || "/";
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="f5l-sidebar">
      <div className="px-2 pb-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--blue)] text-sm font-bold text-white">
            F
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-tight">{orgName}</p>
            <p className="text-[11px] leading-tight text-[var(--muted)]">Console F5L</p>
          </div>
        </Link>
      </div>

      <nav className="flex flex-col gap-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="f5l-sidebar-group-label">{group.label}</p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="f5l-sidebar-link"
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    <span className="f5l-sidebar-icon" aria-hidden>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
