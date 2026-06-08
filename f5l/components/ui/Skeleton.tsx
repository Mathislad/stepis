import type { CSSProperties } from "react";

/** Bloc squelette animé pour les états de chargement. */
export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <div className={`skeleton ${className}`} style={style} />;
}
