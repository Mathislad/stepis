"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface TabBarItem {
  href: string;
  label: string;
  icon: string;
}

/** Bottom tab bar mobile (<768px). Affiche jusqu'à 5 onglets principaux. */
export function TabBar({ items }: { items: TabBarItem[] }) {
  const pathname = usePathname() || "/";
  return (
    <nav className="f5l-tabbar">
      {items.slice(0, 5).map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
            <span className="f5l-tabbar-icon" aria-hidden>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
