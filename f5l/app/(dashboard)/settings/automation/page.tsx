import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-module";

export const metadata = { title: "Réglages — Automatisations" };

interface AutoToggle {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  bientot?: boolean;
}

// V1 : toggles statiques. Quand on branche Brevo en prod, ces toggles
// piloteront les comportements correspondants dans lib/brevo/.
const TOGGLES: AutoToggle[] = [
  {
    key: "sms-reply",
    label: "Réponse SMS au prospect (2 min)",
    description: "« Bonjour [nom], nous avons bien reçu votre demande, nous vous recontactons très vite. »",
    enabled: true,
  },
  {
    key: "email-confirm",
    label: "E-mail de confirmation au prospect",
    description: "Confirmation immédiate envoyée à l'e-mail du prospect.",
    enabled: true,
  },
  {
    key: "sms-notify",
    label: "Notification SMS quand un prospect arrive",
    description: "Vous recevez un SMS sur votre numéro à chaque nouveau prospect.",
    enabled: true,
  },
  {
    key: "relance-48h",
    label: "Relance après 48 h sans réponse",
    description: "« Bonjour [nom], avez-vous pu consulter notre message ? »",
    enabled: false,
    bientot: true,
  },
];

export default async function AutomationSettingsPage() {
  await requireAuth();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <Link href="/settings" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Réglages
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Automatisations</h1>
        <p className="text-sm text-[var(--text-2)]">
          Ce que F5L fait automatiquement pour ne rater aucun prospect.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {TOGGLES.map((t) => (
          <li key={t.key} className="surface flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t.label}</span>
                {t.bientot && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                    style={{ background: "rgba(191,90,242,0.12)", color: "var(--violet)" }}
                  >
                    Bientôt
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[13px] text-[var(--text-2)]">{t.description}</p>
            </div>
            <div className="shrink-0">
              {t.enabled ? (
                <span
                  className="inline-flex h-7 w-12 items-center justify-end rounded-full px-1"
                  style={{ background: "var(--green)" }}
                  aria-label="Activé"
                  title="Activé"
                >
                  <span className="h-5 w-5 rounded-full bg-white" />
                </span>
              ) : (
                <span
                  className="inline-flex h-7 w-12 items-center justify-start rounded-full px-1"
                  style={{ background: "var(--surface-active)" }}
                  aria-label="Désactivé"
                  title="Désactivé"
                >
                  <span className="h-5 w-5 rounded-full bg-[var(--muted)]" />
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="text-[12px] text-[var(--muted)]">
        Les bascules deviendront actives quand Brevo sera connecté. Pour l&apos;instant les
        comportements sont activés par défaut côté code.
      </p>
    </div>
  );
}
