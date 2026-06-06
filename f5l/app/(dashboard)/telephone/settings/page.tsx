import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { getPhoneSettings } from "@/lib/telephone/settings";
import { getVapiStatus } from "@/lib/vapi/client";
import { PhoneSettingsForm } from "@/components/telephone/PhoneSettingsForm";

export const metadata = { title: "Téléphone — Paramètres" };

export default async function PhoneSettingsPage() {
  await requireModule("phone");
  const [settings, vapi] = await Promise.all([getPhoneSettings(), getVapiStatus()]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/telephone" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Téléphone
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Paramètres téléphone</h1>
      </div>

      <div className="surface p-4 text-sm">
        <p className="font-medium">Intégration Vapi</p>
        <p className="mt-1 text-[var(--text-2)]">
          {vapi.configured ? "✓ Configurée" : "⚠ " + vapi.message}
        </p>
      </div>

      <PhoneSettingsForm settings={settings} />
    </div>
  );
}
