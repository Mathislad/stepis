import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-module";
import { COMING_SOON } from "@/lib/coming-soon/modules";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Bientôt disponible — F5L" };

const ACCENT_VARS: Record<string, string> = {
  blue: "var(--blue)",
  violet: "var(--violet)",
  green: "var(--green)",
  amber: "var(--amber)",
  red: "var(--red)",
};

export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ moduleKey: string }>;
}) {
  await requireAuth();
  const { moduleKey } = await params;
  const mod = COMING_SOON[moduleKey];
  if (!mod) notFound();
  const accent = ACCENT_VARS[mod.accent] ?? "var(--blue)";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-7">
      <div>
        <Link
          href="/"
          className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]"
        >
          ← Tableau de bord
        </Link>
      </div>

      <section className="surface flex flex-col items-center gap-4 p-8 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
          style={{ background: `${accent}1f`, color: accent }}
          aria-hidden
        >
          {mod.icon}
        </div>
        <Badge tone={mod.accent}>En développement</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">{mod.label}</h1>
        <p className="max-w-md text-[15px] leading-relaxed text-[var(--text-2)]">
          {mod.pitch}
        </p>
      </section>

      <section className="surface p-6">
        <p className="mb-4 text-[12px] uppercase tracking-wider text-[var(--muted)]">
          Ce que vous obtiendrez
        </p>
        <ul className="flex flex-col gap-3">
          {mod.benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-3 text-[14px]">
              <span style={{ color: accent }} aria-hidden>
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      <form
        action="/api/notify-interest"
        method="post"
        className="surface flex flex-col gap-3 p-5"
      >
        <input type="hidden" name="module" value={mod.key} />
        <p className="text-sm text-[var(--text-2)]">
          On vous prévient dès que c&apos;est prêt ?
        </p>
        <button type="submit" className="btn btn-primary">
          Me notifier au lancement
        </button>
        <p className="text-[11px] text-[var(--muted)]">
          Vous n&apos;êtes ajouté à aucune liste — un simple e-mail au lancement.
        </p>
      </form>

      <p className="text-center text-[12px] text-[var(--muted)]">
        En attendant, votre système d&apos;acquisition tourne déjà.
      </p>
    </div>
  );
}
