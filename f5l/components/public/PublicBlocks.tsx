import type { OfferRow, SiteContentRow } from "@/types/database";
import { asHours, asImage, asOffer, asPrice, asText } from "@/lib/site/blocks";
import { OfferCard } from "@/components/public/PublicOffers";

function Block({ block, offers }: { block: SiteContentRow; offers: OfferRow[] }) {
  switch (block.block_type) {
    case "text": {
      const t = asText(block.content);
      if (!t.title && !t.body) return null;
      return (
        <section>
          {t.title && (
            <h2 className="mb-2 text-xl font-semibold text-zinc-900">{t.title}</h2>
          )}
          {t.body && (
            <p className="whitespace-pre-wrap leading-relaxed text-zinc-700">{t.body}</p>
          )}
        </section>
      );
    }
    case "price": {
      const p = asPrice(block.content);
      if (!p.label) return null;
      return (
        <section className="flex items-baseline justify-between border-b border-zinc-200 pb-2">
          <span className="font-medium text-zinc-800">{p.label}</span>
          <span className="font-semibold text-zinc-900">
            {p.amount} {p.unit}
          </span>
        </section>
      );
    }
    case "hours": {
      const h = asHours(block.content);
      return (
        <section>
          <h2 className="mb-2 text-xl font-semibold text-zinc-900">Horaires</h2>
          <ul className="text-sm text-zinc-700">
            {h.days.map((d) => (
              <li key={d.label} className="flex justify-between border-b border-zinc-100 py-1">
                <span>{d.label}</span>
                <span className={d.closed ? "text-zinc-400" : ""}>
                  {d.closed ? "Fermé" : `${d.open} – ${d.close}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      );
    }
    case "offer": {
      const o = asOffer(block.content);
      const offer = offers.find((x) => x.id === o.offerId);
      if (!offer) return null;
      return <OfferCard offer={offer} />;
    }
    case "image": {
      const i = asImage(block.content);
      if (!i.url) return null;
      return (
        <section>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={i.url} alt={i.alt} className="w-full rounded-2xl" />
        </section>
      );
    }
    default:
      return null;
  }
}

export function PublicBlocks({
  blocks,
  offers,
}: {
  blocks: SiteContentRow[];
  offers: OfferRow[];
}) {
  if (blocks.length === 0) return null;
  return (
    <div className="flex flex-col gap-8">
      {blocks.map((b) => (
        <Block key={b.id} block={b} offers={offers} />
      ))}
    </div>
  );
}
