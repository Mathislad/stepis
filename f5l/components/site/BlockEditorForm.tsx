"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { saveBlockAction, type SiteFormState } from "@/lib/site/actions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { asHours, asImage, asOffer, asPrice, asText } from "@/lib/site/blocks";
import type { OfferRow, SiteContentRow } from "@/types/database";

const INITIAL: SiteFormState = { ok: false, error: null };

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-[var(--text-2)]">
        {label}
        {required && " *"}
      </span>
      {children}
    </label>
  );
}

function Fields({ block, offers }: { block: SiteContentRow; offers: OfferRow[] }) {
  switch (block.block_type) {
    case "text": {
      const t = asText(block.content);
      return (
        <>
          <Field label="Titre">
            <Input name="title" defaultValue={t.title} placeholder="Titre de la section" />
          </Field>
          <Field label="Texte">
            <Textarea name="body" defaultValue={t.body} className="min-h-[140px]" />
          </Field>
        </>
      );
    }
    case "price": {
      const p = asPrice(block.content);
      return (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Libellé">
            <Input name="label" defaultValue={p.label} placeholder="Baguette tradition" />
          </Field>
          <Field label="Montant">
            <Input name="amount" defaultValue={p.amount} placeholder="1,30" />
          </Field>
          <Field label="Unité">
            <Input name="unit" defaultValue={p.unit} placeholder="€" />
          </Field>
        </div>
      );
    }
    case "hours": {
      const h = asHours(block.content);
      return (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-[var(--text-2)]">Horaires par jour</span>
          {h.days.map((d, i) => (
            <div key={d.label} className="flex items-center gap-2">
              <span className="w-24 text-sm">{d.label}</span>
              <Input
                name={`day_${i}_open`}
                type="time"
                defaultValue={d.open}
                style={{ width: "auto" }}
              />
              <span className="text-[var(--muted)]">–</span>
              <Input
                name={`day_${i}_close`}
                type="time"
                defaultValue={d.close}
                style={{ width: "auto" }}
              />
              <label className="ml-auto flex items-center gap-1.5 text-[13px] text-[var(--text-2)]">
                <input type="checkbox" name={`day_${i}_closed`} defaultChecked={d.closed} />
                Fermé
              </label>
            </div>
          ))}
        </div>
      );
    }
    case "offer": {
      const o = asOffer(block.content);
      return (
        <Field label="Offre à afficher">
          <Select name="offerId" defaultValue={o.offerId ?? ""}>
            <option value="">— Aucune —</option>
            {offers.map((of) => (
              <option key={of.id} value={of.id}>
                {of.title}
                {of.active ? "" : " (inactive)"}
              </option>
            ))}
          </Select>
        </Field>
      );
    }
    case "image": {
      const i = asImage(block.content);
      return (
        <>
          {/* MVP : URL d'image (upload Supabase Storage hors périmètre). */}
          <Field label="URL de l'image">
            <Input name="url" defaultValue={i.url} placeholder="https://…" />
          </Field>
          <Field label="Texte alternatif">
            <Input name="alt" defaultValue={i.alt} placeholder="Description de l'image" />
          </Field>
          {i.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={i.url} alt={i.alt} className="max-h-48 w-full rounded-lg object-cover" />
          )}
        </>
      );
    }
    default:
      return null;
  }
}

export function BlockEditorForm({
  block,
  offers,
  publicSlug,
}: {
  block: SiteContentRow;
  offers: OfferRow[];
  publicSlug: string;
}) {
  const [state, formAction, pending] = useActionState(saveBlockAction, INITIAL);

  return (
    <form action={formAction} className="surface flex flex-col gap-4 p-5">
      <input type="hidden" name="blockKey" value={block.block_key} />
      <input type="hidden" name="blockType" value={block.block_type} />
      <input type="hidden" name="position" value={block.position} />

      <Fields block={block} offers={offers} />

      {state.error && (
        <p className="text-sm" style={{ color: "var(--red)" }} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm" style={{ color: "var(--green)" }}>
          Enregistré ✓
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <a
          href={`/p/${publicSlug}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
        >
          Prévisualiser ↗
        </a>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
