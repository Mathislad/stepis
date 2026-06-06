import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/auth/context";
import type {
  DocumentRow,
  DocumentStatus,
  DocumentType,
  Json,
  PaymentReminderRow,
} from "@/types/database";

export const DOCUMENTS_PAGE_SIZE = 20;

export interface DocumentInput {
  doc_type: DocumentType;
  title: string;
  recipient_name?: string | null;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  content?: Json;
  amount?: number | null;
  due_date?: string | null;
  status?: DocumentStatus;
  signature_url?: string | null;
  file_url?: string | null;
}

export interface DocumentListResult {
  rows: DocumentRow[];
  total: number;
  page: number;
  pageCount: number;
}

export async function listDocuments(
  filters: { type?: DocumentType; status?: DocumentStatus; page?: number } = {},
): Promise<DocumentListResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * DOCUMENTS_PAGE_SIZE;
  const to = from + DOCUMENTS_PAGE_SIZE - 1;

  let q = supabase
    .from("documents")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  if (filters.type) q = q.eq("doc_type", filters.type);
  if (filters.status) q = q.eq("status", filters.status);

  const { data, count, error } = await q.range(from, to);
  if (error) throw new Error(`listDocuments: ${error.message}`);
  const total = count ?? 0;
  return {
    rows: data ?? [],
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / DOCUMENTS_PAGE_SIZE)),
  };
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getDocument: ${error.message}`);
  return data ?? null;
}

export async function getDocumentWithReminders(id: string): Promise<{
  doc: DocumentRow;
  reminders: PaymentReminderRow[];
} | null> {
  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getDocumentWithReminders: ${error.message}`);
  if (!doc) return null;
  const { data: reminders } = await supabase
    .from("payment_reminders")
    .select("*")
    .eq("document_id", id)
    .order("sent_at", { ascending: false });
  return { doc, reminders: reminders ?? [] };
}

export async function createDocument(input: DocumentInput): Promise<DocumentRow> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("createDocument: organisation introuvable.");
  const { data, error } = await supabase
    .from("documents")
    .insert({ ...input, org_id: orgId, content: input.content ?? ({} as Json) })
    .select("*")
    .single();
  if (error) throw new Error(`createDocument: ${error.message}`);
  return data;
}

export async function updateDocument(
  id: string,
  input: Partial<DocumentInput>,
): Promise<DocumentRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`updateDocument: ${error.message}`);
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error(`deleteDocument: ${error.message}`);
}

export async function markDocumentPaid(id: string): Promise<void> {
  await updateDocument(id, { status: "paid" });
}

export async function markDocumentSent(id: string): Promise<void> {
  await updateDocument(id, { status: "sent" });
}
