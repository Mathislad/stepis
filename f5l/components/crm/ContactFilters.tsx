"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  CONTACT_SOURCE_LABELS,
  CONTACT_TYPE_LABELS,
  PIPELINE_LABELS,
} from "@/lib/crm/labels";

const AUTO = { width: "auto" } as const;

/** Barre de filtres (type / statut / source / recherche) pilotant l'URL. */
export function ContactFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function update(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        update({ q });
      }}
    >
      <Input
        type="search"
        placeholder="Rechercher (nom, e-mail, téléphone)…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="flex-1 py-2"
        style={{ width: "auto", minWidth: "200px" }}
      />
      <Select
        value={searchParams.get("type") ?? ""}
        onChange={(e) => update({ type: e.target.value })}
        className="py-2"
        style={AUTO}
        aria-label="Filtrer par type"
      >
        <option value="">Tous types</option>
        <option value="b2b">{CONTACT_TYPE_LABELS.b2b}</option>
        <option value="b2c">{CONTACT_TYPE_LABELS.b2c}</option>
      </Select>
      <Select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => update({ status: e.target.value })}
        className="py-2"
        style={AUTO}
        aria-label="Filtrer par statut"
      >
        <option value="">Tous statuts</option>
        {Object.entries(PIPELINE_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </Select>
      <Select
        value={searchParams.get("source") ?? ""}
        onChange={(e) => update({ source: e.target.value })}
        className="py-2"
        style={AUTO}
        aria-label="Filtrer par source"
      >
        <option value="">Toutes sources</option>
        {Object.entries(CONTACT_SOURCE_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </Select>
      <button type="submit" className="btn btn-ghost py-2">
        Rechercher
      </button>
    </form>
  );
}
