"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Bouton de soumission avec confirmation native. À placer dans un `<form>`
 * dont l'`action` est une Server Action (le composant parent peut rester serveur).
 */
export function ConfirmButton({
  children,
  message,
  className,
  style,
}: {
  children: ReactNode;
  message: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
