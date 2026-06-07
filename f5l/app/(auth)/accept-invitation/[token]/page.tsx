import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AcceptInvitationForm } from "@/components/auth/AcceptInvitationForm";

export const metadata = { title: "Rejoindre l'équipe — F5L" };

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("lookup_invitation", { p_token: token });
  const inv = data?.[0];

  if (!inv) {
    return (
      <div className="surface p-7 text-center">
        <h1 className="text-xl font-semibold">Invitation invalide</h1>
        <p className="mt-2 text-sm text-[var(--text-2)]">
          Ce lien d&apos;invitation a expiré ou a déjà été utilisé.
        </p>
        <Link href="/login" className="btn btn-ghost mt-4">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="surface p-7">
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Rejoindre {inv.org_name}</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          Vous avez été invité(e) en tant que <strong>{inv.role}</strong>.
        </p>
      </div>
      <AcceptInvitationForm token={token} email={inv.email} />
    </div>
  );
}
