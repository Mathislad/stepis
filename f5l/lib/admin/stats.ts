import { createClient } from "@/lib/supabase/server";

export interface AdminStats {
  totalDocuments: number;
  awaitingSignature: number;
  overdue: number;
  totalBilled: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("status, amount, doc_type, due_date");
  if (error) throw new Error(`getAdminStats: ${error.message}`);
  const rows = data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  let awaitingSignature = 0;
  let overdue = 0;
  let totalBilled = 0;
  for (const r of rows) {
    if (r.doc_type === "contrat" && (r.status === "sent" || r.status === "draft")) {
      awaitingSignature++;
    }
    if (
      r.doc_type === "facture" &&
      r.status !== "paid" &&
      r.status !== "cancelled" &&
      r.due_date &&
      r.due_date < today
    ) {
      overdue++;
    }
    if (r.doc_type === "facture" && r.amount != null) {
      totalBilled += Number(r.amount);
    }
  }
  return {
    totalDocuments: rows.length,
    awaitingSignature,
    overdue,
    totalBilled,
  };
}
