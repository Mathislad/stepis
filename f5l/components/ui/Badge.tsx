import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "green" | "blue" | "violet" | "amber" | "red";

const TONES: Record<BadgeTone, { color: string; bg: string; border: string }> = {
  neutral: { color: "var(--text-2)", bg: "var(--surface)", border: "var(--border)" },
  green: { color: "var(--green)", bg: "rgba(48,209,88,0.12)", border: "rgba(48,209,88,0.35)" },
  blue: { color: "var(--blue)", bg: "rgba(10,132,255,0.12)", border: "rgba(10,132,255,0.35)" },
  violet: { color: "var(--violet)", bg: "rgba(191,90,242,0.12)", border: "rgba(191,90,242,0.35)" },
  amber: { color: "var(--amber)", bg: "rgba(255,159,10,0.12)", border: "rgba(255,159,10,0.35)" },
  red: { color: "var(--red)", bg: "rgba(255,69,58,0.12)", border: "rgba(255,69,58,0.35)" },
};

/** Petit badge coloré (statut pipeline, type de contact, etc.). */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const t = TONES[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ color: t.color, backgroundColor: t.bg, borderColor: t.border }}
    >
      {children}
    </span>
  );
}
