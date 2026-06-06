import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { listCalls, getCallStats } from "@/lib/telephone/calls";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import type { CallStatus } from "@/types/database";

export const metadata = { title: "Téléphone" };

const STATUS_LABELS: Record<CallStatus, string> = {
  missed: "Manqué",
  answered: "Répondu",
  voicemail: "Messagerie",
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="surface p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[12px] text-[var(--text-2)]">{label}</p>
    </div>
  );
}

function formatDuration(sec: number): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default async function PhonePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireModule("phone");
  const sp = await searchParams;
  const status = (["missed", "answered", "voicemail"] as const).find((s) => s === sp.status);
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;

  const [stats, result] = await Promise.all([
    getCallStats(),
    listCalls({ status, page }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Téléphone</h1>
          <p className="text-sm text-[var(--text-2)]">Journal des appels</p>
        </div>
        <Link href="/telephone/settings" className="btn btn-ghost">
          Paramètres
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Appels au total" value={stats.total} />
        <Stat label="Manqués" value={stats.missed} />
        <Stat label="Répondus" value={stats.answered} />
        <Stat label="Durée moyenne" value={formatDuration(stats.avgDurationSec)} />
      </div>

      <nav className="flex flex-wrap gap-2 text-[13px]">
        <Link href="/telephone" className={`btn btn-ghost py-1.5 ${!status ? "border-[var(--border-strong)]" : ""}`}>
          Tous
        </Link>
        {(["missed", "answered", "voicemail"] as CallStatus[]).map((s) => (
          <Link
            key={s}
            href={`/telephone?status=${s}`}
            className={`btn btn-ghost py-1.5 ${status === s ? "border-[var(--border-strong)]" : ""}`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </nav>

      {result.rows.length === 0 ? (
        <div className="surface flex flex-col items-center gap-2 px-5 py-14 text-center">
          <p className="text-3xl">📞</p>
          <p className="font-medium">Aucun appel</p>
          <p className="max-w-xs text-sm text-[var(--text-2)]">
            Les appels reçus s&apos;afficheront ici dès que votre agent téléphonique sera actif.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {result.rows.map((c) => (
            <li key={c.id} className="surface surface-hover flex items-center justify-between gap-3 p-3">
              <Link href={`/telephone/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {c.caller_name ?? c.caller_phone ?? "Numéro inconnu"}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--text-2)]">
                    {formatDateTime(c.created_at)} · {formatDuration(c.duration_seconds)}
                  </p>
                </div>
              </Link>
              <Badge tone={c.status === "answered" ? "green" : c.status === "missed" ? "amber" : "neutral"}>
                {STATUS_LABELS[c.status]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
