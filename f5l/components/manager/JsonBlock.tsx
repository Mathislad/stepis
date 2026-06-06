import type { Json } from "@/types/database";

function renderJson(value: Json): string {
  return JSON.stringify(value, null, 2);
}

export function JsonBlock({ value }: { value: Json }) {
  return (
    <pre className="overflow-auto rounded-lg border border-[var(--border)] bg-black/25 p-3 text-[12px] leading-relaxed text-[var(--text-2)]">
      {renderJson(value)}
    </pre>
  );
}
