import Link from "next/link";
import { requireModule } from "@/lib/auth/require-module";
import { getOffer, listOffers } from "@/lib/site/offers";
import { OfferForm } from "@/components/site/OfferForm";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteOfferAction } from "@/lib/site/actions";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Offres" };

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireModule("site");
  const sp = await searchParams;

  const [offers, editing] = await Promise.all([
    listOffers(),
    sp.edit ? getOffer(sp.edit) : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/site" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
          ← Mon site
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Offres</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-[var(--text-2)]">
            {editing ? "Modifier l'offre" : "Nouvelle offre"}
          </h2>
          {/* `key` force le remount → réinitialise le formulaire entre create/edit. */}
          <OfferForm key={editing?.id ?? "new"} offer={editing ?? undefined} />
          {editing && (
            <Link href="/site/offers" className="text-[13px] text-[var(--text-2)] hover:text-[var(--text)]">
              Annuler la modification
            </Link>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-[var(--text-2)]">Vos offres</h2>
          {offers.length === 0 ? (
            <div className="surface p-6 text-center text-sm text-[var(--text-2)]">
              Aucune offre pour l&apos;instant.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {offers.map((o) => (
                <li key={o.id} className="surface flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{o.title}</span>
                      <Badge tone={o.active ? "green" : "neutral"}>
                        {o.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-[var(--text-2)]">
                      {o.discount ?? ""}
                      {o.valid_until ? ` · jusqu'au ${formatDate(o.valid_until)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Link
                      href={`/site/offers?edit=${o.id}`}
                      className="btn btn-ghost px-3 py-1.5 text-[13px]"
                    >
                      Éditer
                    </Link>
                    <form action={deleteOfferAction}>
                      <input type="hidden" name="offerId" value={o.id} />
                      <ConfirmButton
                        message="Supprimer cette offre ?"
                        className="btn btn-ghost px-3 py-1.5 text-[13px]"
                        style={{ color: "var(--red)" }}
                      >
                        Suppr.
                      </ConfirmButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
