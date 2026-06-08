import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/auth/context";
import type {
  ContactRow,
  ContactSource,
  ContactType,
  PipelineStatus,
} from "@/types/database";

export const CONTACTS_PAGE_SIZE = 20;

export interface ContactListFilters {
  type?: ContactType;
  status?: PipelineStatus;
  source?: ContactSource;
  search?: string;
  page?: number;
}

export interface ContactListResult {
  rows: ContactRow[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

/**
 * Liste paginée des contacts du tenant courant (RLS auto-scope par org).
 * Recherche `ilike` sur nom / e-mail / téléphone. Tri par dernière activité.
 */
export async function listContacts(
  filters: ContactListFilters = {},
): Promise<ContactListResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * CONTACTS_PAGE_SIZE;
  const to = from + CONTACTS_PAGE_SIZE - 1;

  let query = supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (filters.type) query = query.eq("type", filters.type);
  if (filters.status) query = query.eq("pipeline_status", filters.status);
  if (filters.source) query = query.eq("source", filters.source);

  const term = filters.search?.trim();
  if (term) {
    // Neutralise les caractères spéciaux de la syntaxe PostgREST `.or()`.
    const safe = term.replace(/[%,()*]/g, " ");
    query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(`listContacts: ${error.message}`);

  const total = count ?? 0;
  return {
    rows: data ?? [],
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / CONTACTS_PAGE_SIZE)),
    pageSize: CONTACTS_PAGE_SIZE,
  };
}

export async function getContact(id: string): Promise<ContactRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getContact: ${error.message}`);
  return data ?? null;
}

/** Champs acceptés à la création/édition. `org_id` n'est JAMAIS accepté ici. */
export interface ContactInput {
  type: ContactType;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  note?: string | null;
  source?: ContactSource;
  // B2B
  sector?: string | null;
  potential_value?: number | null;
  pipeline_status?: PipelineStatus | null;
  // B2C
  recurrence?: string | null;
  birthday?: string | null;
}

export async function createContact(input: ContactInput): Promise<ContactRow> {
  const supabase = await createClient();
  // `org_id` résolu côté serveur (jamais depuis le client). RLS WITH CHECK valide.
  const orgId = await getCurrentOrgId();
  if (!orgId) throw new Error("createContact: organisation introuvable.");

  const { data, error } = await supabase
    .from("contacts")
    .insert({ ...input, org_id: orgId, source: input.source ?? "manual" })
    .select("*")
    .single();
  if (error) throw new Error(`createContact: ${error.message}`);
  return data;
}

export async function updateContact(
  id: string,
  input: Partial<ContactInput>,
): Promise<ContactRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`updateContact: ${error.message}`);
  return data;
}

export async function deleteContact(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw new Error(`deleteContact: ${error.message}`);
}
