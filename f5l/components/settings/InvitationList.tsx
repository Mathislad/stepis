"use client";

import { useState } from "react";
import type { InvitationRow } from "@/types/database";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { revokeInvitationAction } from "@/lib/settings/actions";
import { formatDate } from "@/lib/utils";

function inviteUrl(token: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/accept-invitation/${token}`;
}

export function InvitationList({ invitations }: { invitations: InvitationRow[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(token: string, id: string) {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <ul className="flex flex-col gap-2">
      {invitations.map((inv) => (
        <li key={inv.id} className="surface flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{inv.email}</span>
              <Badge tone={inv.role === "owner" ? "blue" : "neutral"}>
                {inv.role === "owner" ? "Propriétaire" : "Collaborateur"}
              </Badge>
            </div>
            <p className="text-[12px] text-[var(--text-2)]">
              Expire le {formatDate(inv.expires_at)}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => copy(inv.token, inv.id)}
              className="btn btn-ghost px-3 py-1.5 text-[13px]"
            >
              {copiedId === inv.id ? "Lien copié ✓" : "Copier le lien"}
            </button>
            <form action={revokeInvitationAction}>
              <input type="hidden" name="invitationId" value={inv.id} />
              <ConfirmButton
                message="Annuler cette invitation ?"
                className="btn btn-ghost px-3 py-1.5 text-[13px]"
                style={{ color: "var(--red)" }}
              >
                Annuler
              </ConfirmButton>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
