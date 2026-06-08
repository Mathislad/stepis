/**
 * Barre de progression réutilisable (dashboard sombre & site public clair).
 * Les couleurs sont paramétrables pour s'adapter aux deux thèmes.
 */
export function ProgressBar({
  pct,
  track = "var(--surface-strong)",
  fill = "var(--green)",
}: {
  pct: number;
  track?: string;
  fill?: string;
}) {
  const width = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full"
      style={{ background: track }}
      role="progressbar"
      aria-valuenow={width}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${width}%`, background: fill }}
      />
    </div>
  );
}
