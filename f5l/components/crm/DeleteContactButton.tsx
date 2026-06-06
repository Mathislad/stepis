"use client";

import { deleteContactAction } from "@/lib/crm/actions";

/** Bouton de suppression avec confirmation native avant soumission. */
export function DeleteContactButton({ contactId }: { contactId: string }) {
  return (
    <form
      action={deleteContactAction}
      onSubmit={(e) => {
        if (!confirm("Supprimer définitivement ce contact et son historique ?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="contactId" value={contactId} />
      <button
        type="submit"
        className="btn btn-ghost px-3 py-1.5 text-[13px]"
        style={{ color: "var(--red)" }}
      >
        Supprimer
      </button>
    </form>
  );
}
