"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SidebarItem {
  href: string;
  label: string;
  icon: string;
  locked?: boolean;
}

export interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

/**
 * Sidebar dashboard avec groupes thématiques. Les items `locked` ouvrent
 * /bientot/[key] (badge « Prochainement »).
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
            <p className="text-[11px] leading-tight text-[var(--muted)]">F5L Acquisition</p>
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
                    style={item.locked ? { opacity: 0.6 } : undefined}
                  >
                    <span className="f5l-sidebar-icon" aria-hidden>
                      {item.locked ? "🔒" : item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.locked && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                        style={{
                          background: "rgba(191,90,242,0.12)",
                          color: "var(--violet)",
                        }}
                      >
                        Bientôt
                      </span>
                    )}
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
