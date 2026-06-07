import { requireAuth } from "@/lib/auth/require-module";
import { getOrgSettings } from "@/lib/settings/org";
import { OrgSettingsForm } from "@/components/settings/OrgSettingsForm";

export const metadata = { title: "Réglages — Mon commerce" };

export default async function OrgSettingsPage() {
  await requireAuth();
  const org = await getOrgSettings();
  return (
    <div className="mx-auto max-w-2xl">
      <OrgSettingsForm org={org!} />
    </div>
  );
}
