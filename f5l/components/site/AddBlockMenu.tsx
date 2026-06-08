import { Select } from "@/components/ui/Select";
import { BLOCK_TYPE_LABELS } from "@/lib/site/blocks";
import { addBlockAction } from "@/lib/site/actions";
import type { BlockType } from "@/types/database";

/** Menu « + Ajouter un bloc » : choisit un type puis crée le bloc (server action). */
export function AddBlockMenu() {
  const types = Object.keys(BLOCK_TYPE_LABELS) as BlockType[];
  return (
    <form action={addBlockAction} className="flex items-center gap-2">
      <Select
        name="blockType"
        defaultValue="text"
        aria-label="Type de bloc"
        style={{ width: "auto" }}
        className="py-1.5"
      >
        {types.map((t) => (
          <option key={t} value={t}>
            {BLOCK_TYPE_LABELS[t]}
          </option>
        ))}
      </Select>
      <button type="submit" className="btn btn-primary px-3 py-1.5 text-[13px]">
        + Ajouter
      </button>
    </form>
  );
}
