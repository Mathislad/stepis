import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-module";
import { getMySubscription } from "@/lib/settings/subscription";
import { FORMULA_PLANS } from "@/lib/billing/formulas";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Réglages" };

const STATUS_LABELS: Record<string, string> = {
  trialing: "Essai en cours",
  active: "Active",
  past_due: "Paiement en retard",
  canceled: "Annulée",
  incomplete: "Incomplète",
};

const STATUS_TONES = {
  trialing: "violet",
  active: "green",
  past_due: "amber",
  canceled: "neutral",
  incomplete: "amber",
} as const;

export default async function SettingsHome() {
  const ctx = await requireAuth();
  const sub = await getMySubscription();
  const plan = FORMULA_PLANS[ctx.org.formula];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Mon commerce" href="/settings/org">
        <p className="font-medium">{ctx.org.name}</p>
        <p className="text-sm text-[var(--text-2)]">
          f5l.app/p/<span className="text-[var(--text)]">{ctx.org.slug}</span>
        </p>
        {ctx.org.contact_email && (
          <p className="mt-2 text-[13px] text-[var(--text-2)]">{ctx.org.contact_email}</p>
        )}
      </Card>

      <Card title="Mon profil" href="/settings/profile">
        <p className="font-medium">{ctx.profile.full_name ?? "—"}</p>
        <p className="text-sm text-[var(--text-2)]">{ctx.email}</p>
        <Badge tone={ctx.profile.role === "owner" ? "blue" : "neutral"}>
          {ctx.profile.role === "owner" ? "Propriétaire" : "Collaborateur"}
        </Badge>
      </Card>

      <Card title="Abonnement" href="/settings/billing">
        <div className="flex items-center gap-2">
          <p className="font-medium">Formule {plan.label}</p>
          <Badge tone={STATUS_TONES[sub?.status ?? "trialing"]}>
            {STATUS_LABELS[sub?.status ?? "trialing"]}
          </Badge>
        </div>
        <p className="text-sm text-[var(--text-2)]">{plan.priceMonthlyEur} € / mois</p>
        {sub?.current_period_end && (
          <p className="mt-1 text-[13px] text-[var(--text-2)]">
            Renouvellement le {formatDate(sub.current_period_end)}
          </p>
        )}
      </Card>

      <Card title="Mon équipe" href="/settings/members">
        <p className="text-sm text-[var(--text-2)]">
          Inviter vos collaborateurs et gérer leurs accès.
        </p>
      </Card>
    </div>
  );
}

function Card({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="surface surface-hover block p-5">
      <p className="mb-2 text-[12px] uppercase tracking-wider text-[var(--muted)]">{title}</p>
      <div className="flex flex-col gap-1">{children}</div>
      <p className="mt-3 text-[13px] text-[var(--blue)]">Modifier →</p>
    </Link>
  );
}
