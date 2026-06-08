"use client";

import { useState } from "react";

/** Affiche le QR code (data-URL) + l'URL publique copiable. */
export function QrDisplay({ qrDataUrl, url }: { qrDataUrl: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponible */
    }
  }

  return (
    <div className="surface flex flex-col items-center gap-3 p-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt="QR code de la carte de fidélité"
        width={200}
        height={200}
        className="rounded-lg bg-white p-2"
      />
      <div className="flex w-full items-center gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="input flex-1 text-[12px]"
          style={{ width: "auto" }}
          aria-label="Lien public de la carte"
        />
        <button type="button" onClick={copy} className="btn btn-ghost px-3 py-1.5 text-[13px]">
          {copied ? "Copié ✓" : "Copier"}
        </button>
      </div>
    </div>
  );
}
