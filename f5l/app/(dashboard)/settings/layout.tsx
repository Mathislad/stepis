import type { ReactNode } from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-module";

const TABS = [
  { href: "/settings", label: "Vue d'ensemble", exact: true },
  { href: "/settings/org", label: "Mon commerce" },
  { href: "/settings/profile", label: "Mon profil" },
  { href: "/settings/members", label: "Mon équipe" },
  { href: "/settings/automation", label: "Automatisations" },
  { href: "/settings/billing", label: "Abonnement" },
];

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requireAuth();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Réglages</h1>
        <p className="text-sm text-[var(--text-2)]">Votre commerce, votre équipe, votre abonnement.</p>
      </header>
      <nav className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-md px-3 py-1.5 text-[13px] font-medium text-[var(--text-2)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}
