import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Carte translucide (surface) — primitive d'affichage de base. */
export function Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={cn("surface", hover && "surface-hover", "p-5", className)}>
      {children}
    </div>
  );
}
