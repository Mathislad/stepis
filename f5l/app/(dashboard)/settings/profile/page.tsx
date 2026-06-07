import { requireAuth } from "@/lib/auth/require-module";
import { getMyProfile } from "@/lib/settings/profile";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

export const metadata = { title: "Réglages — Mon profil" };

export default async function ProfileSettingsPage() {
  const ctx = await requireAuth();
  const profile = await getMyProfile();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <ProfileForm profile={profile!} email={ctx.email ?? ""} />
      <ChangePasswordForm />
    </div>
  );
}
