import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth/require-module";
import { getContact } from "@/lib/crm/contacts";
import { listActivities } from "@/lib/crm/activities";
import { ContactForm } from "@/components/crm/ContactForm";
import { ActivityComposer } from "@/components/crm/ActivityComposer";
import { ActivityTimeline } from "@/components/crm/ActivityTimeline";
import { DeleteContactButton } from "@/components/crm/DeleteContactButton";
import { Badge } from "@/components/ui/Badge";
import {
  CONTACT_SOURCE_LABELS,
  CONTACT_TYPE_LABELS,
  SOURCE_TONES,
} from "@/lib/crm/labels";

export const metadata = { title: "Fiche client" };

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  await requireModule("crm");
  const { contactId } = await params;

  const contact = await getContact(contactId);
  if (!contact) notFound();

  const activities = await listActivities(contactId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/crm" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Mes clients
        </Link>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{contact.name}</h1>
              <Badge tone={contact.type === "b2b" ? "violet" : "neutral"}>
                {CONTACT_TYPE_LABELS[contact.type]}
              </Badge>
              <Badge tone={SOURCE_TONES[contact.source]}>
                {CONTACT_SOURCE_LABELS[contact.source]}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-[var(--text-2)]">
              {contact.email ?? contact.phone ?? "Aucune coordonnée"}
            </p>
          </div>
          <DeleteContactButton contactId={contact.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-[var(--text-2)]">Informations</h2>
          <ContactForm mode="edit" contact={contact} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-[var(--text-2)]">Échanges</h2>
          <ActivityComposer contactId={contact.id} />
          <div className="surface p-4">
            <ActivityTimeline activities={activities} />
          </div>
        </section>
      </div>
    </div>
  );
}
