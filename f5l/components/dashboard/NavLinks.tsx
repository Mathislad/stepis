"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
}

/** Liens de navigation du shell, avec état actif (client). */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-[var(--surface-strong)] text-[var(--text)]"
                : "text-[var(--text-2)] hover:text-[var(--text)]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
