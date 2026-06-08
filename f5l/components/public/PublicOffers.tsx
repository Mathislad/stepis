import type { OfferRow } from "@/types/database";

/** Carte d'offre (thème clair) — partagée par les blocs et la section offres. */
export function OfferCard({ offer }: { offer: OfferRow }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-zinc-900">{offer.title}</h3>
        {offer.discount && (
          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-sm font-semibold text-white">
            {offer.discount}
          </span>
        )}
      </div>
      {offer.description && <p className="mt-1 text-sm text-zinc-600">{offer.description}</p>}
    </div>
  );
}

export function PublicOffers({ offers }: { offers: OfferRow[] }) {
  return (
    <section className="mt-10 flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-zinc-900">Nos offres</h2>
      {offers.map((o) => (
        <OfferCard key={o.id} offer={o} />
      ))}
    </section>
  );
}
