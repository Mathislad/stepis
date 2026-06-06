import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth/require-module";
import { getCall } from "@/lib/telephone/calls";
import { rappelerAction } from "@/lib/telephone/actions";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import type { CallStatus } from "@/types/database";

export const metadata = { title: "Appel" };

const LABELS: Record<CallStatus, string> = {
  missed: "Appel manqué",
  answered: "Appel répondu",
  voicemail: "Message vocal",
};

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ callId: string }>;
}) {
  await requireModule("phone");
  const { callId } = await params;
  const call = await getCall(callId);
  if (!call) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/telephone" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Téléphone
        </Link>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{LABELS[call.status]}</h1>
            <p className="text-sm text-[var(--text-2)]">{formatDateTime(call.created_at)}</p>
          </div>
          <Badge tone={call.status === "answered" ? "green" : call.status === "missed" ? "amber" : "neutral"}>
            {LABELS[call.status]}
          </Badge>
        </div>
      </div>

      <div className="surface flex flex-col gap-3 p-5">
        <div>
          <p className="text-[12px] text-[var(--text-2)]">Appelant</p>
          <p className="text-lg font-medium">{call.caller_name ?? "—"}</p>
          <p className="text-sm text-[var(--text-2)]">{call.caller_phone ?? "Numéro inconnu"}</p>
        </div>
        {call.summary && (
          <div>
            <p className="mt-2 text-[12px] text-[var(--text-2)]">Résumé</p>
            <p className="whitespace-pre-wrap text-sm">{call.summary}</p>
          </div>
        )}
        {call.recording_url && (
          <div>
            <p className="mt-2 text-[12px] text-[var(--text-2)]">Enregistrement</p>
            <audio controls src={call.recording_url} className="mt-1 w-full" />
          </div>
        )}
      </div>

      {call.caller_phone && (
        <form action={rappelerAction}>
          <input type="hidden" name="callId" value={call.id} />
          <button type="submit" className="btn btn-primary">
            Envoyer un SMS de rappel
          </button>
        </form>
      )}
    </div>
  );
}
