import type { MemberRow } from "@/lib/settings/members";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { removeMemberAction } from "@/lib/settings/actions";

export function MemberList({
  members,
  currentUserId,
}: {
  members: MemberRow[];
  currentUserId: string;
}) {
  if (members.length === 0) {
    return (
      <p className="surface p-6 text-center text-sm text-[var(--text-2)]">
        Aucun membre — vous êtes seul(e) pour l&apos;instant.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {members.map((m) => {
        const isMe = m.id === currentUserId;
        return (
          <li
            key={m.id}
            className="surface flex items-center justify-between gap-3 p-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{m.full_name ?? m.email ?? "—"}</span>
                <Badge tone={m.role === "owner" ? "blue" : "neutral"}>
                  {m.role === "owner" ? "Propriétaire" : "Collaborateur"}
                </Badge>
                {isMe && <Badge tone="violet">Vous</Badge>}
              </div>
              {m.email && <p className="text-[12px] text-[var(--text-2)]">{m.email}</p>}
            </div>
            {!isMe && (
              <form action={removeMemberAction}>
                <input type="hidden" name="profileId" value={m.id} />
                <ConfirmButton
                  message={`Retirer ${m.full_name ?? m.email ?? "ce membre"} de l'équipe ?`}
                  className="btn btn-ghost px-3 py-1.5 text-[13px]"
                  style={{ color: "var(--red)" }}
                >
                  Retirer
                </ConfirmButton>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
