import { requireAuth } from "@/lib/auth/require-module";
import { listMembers, listPendingInvitations } from "@/lib/settings/members";
import { InviteMemberForm } from "@/components/settings/InviteMemberForm";
import { MemberList } from "@/components/settings/MemberList";
import { InvitationList } from "@/components/settings/InvitationList";

export const metadata = { title: "Réglages — Mon équipe" };

export default async function MembersSettingsPage() {
  const ctx = await requireAuth();
  const [members, invitations] = await Promise.all([listMembers(), listPendingInvitations()]);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <section>
        <h2 className="mb-2 text-sm font-medium text-[var(--text-2)]">Inviter un collaborateur</h2>
        <InviteMemberForm />
      </section>

      {invitations.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-[var(--text-2)]">Invitations en attente</h2>
          <InvitationList invitations={invitations} />
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-[var(--text-2)]">Membres actuels</h2>
        <MemberList members={members} currentUserId={ctx.userId} />
      </section>
    </div>
  );
}
