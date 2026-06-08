import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { MessageRow } from "@/types/database";

export function RecentMessages({ messages }: { messages: MessageRow[] }) {
  if (messages.length === 0) {
    return (
      <div className="surface p-5 text-sm text-[var(--text-2)]">
        Aucun envoi journalisé pour le moment.
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)]">
      {messages.map((message) => (
        <li key={message.id} className="flex items-center justify-between gap-3 bg-black/15 p-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone={message.channel === "sms" ? "blue" : "violet"}>
                {message.channel.toUpperCase()}
              </Badge>
              <span className="text-sm text-[var(--text)]">
                {message.status ?? "statut inconnu"}
              </span>
            </div>
            <p className="mt-1 text-[12px] text-[var(--text-2)]">
              {formatDate(message.sent_at)}
            </p>
          </div>
          <p className="text-[13px] tabular-nums text-[var(--text-2)]">
            {message.cost_units} unités
          </p>
        </li>
      ))}
    </ul>
  );
}
