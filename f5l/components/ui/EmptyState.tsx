import type { ReactNode } from "react";

/** État vide réutilisable : icône + titre + description + CTA optionnel. */
export function EmptyState({
  icon = "—",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center gap-2 px-5 py-14 text-center">
      <p className="text-3xl">{icon}</p>
      <p className="font-medium">{title}</p>
      {description && (
        <p className="max-w-xs text-sm text-[var(--text-2)]">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
