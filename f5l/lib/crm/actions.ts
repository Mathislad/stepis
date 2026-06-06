"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireModule } from "@/lib/auth/require-module";
import {
  createContact,
  deleteContact,
  updateContact,
  type ContactInput,
} from "@/lib/crm/contacts";
import { addActivity } from "@/lib/crm/activities";
import { convertLeadToContact, updateLeadStatus } from "@/lib/crm/leads";
import type {
  ActivityType,
  ContactType,
  LeadStatus,
  PipelineStatus,
} from "@/types/database";

export interface CrmFormState {
  ok: boolean;
  error: string | null;
}
const OK: CrmFormState = { ok: true, error: null };

// ── Helpers de parsing FormData ─────────────────────────────────────────────
function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function optStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}
function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const CONTACT_TYPES: ContactType[] = ["b2b", "b2c"];
const PIPELINE: PipelineStatus[] = ["lead", "qualified", "proposal", "won", "lost"];
const ACTIVITY_TYPES: ActivityType[] = ["call", "email", "sms", "note", "quote", "visit"];
const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "converted", "archived"];

function buildInput(fd: FormData, type: ContactType): ContactInput {
  const common = {
    type,
    name: str(fd, "name"),
    phone: optStr(fd, "phone"),
    email: optStr(fd, "email"),
    address: optStr(fd, "address"),
    note: optStr(fd, "note"),
  };
  if (type === "b2b") {
    const status = optStr(fd, "pipeline_status");
    return {
      ...common,
      sector: optStr(fd, "sector"),
      potential_value: num(fd, "potential_value"),
      pipeline_status:
        status && (PIPELINE as string[]).includes(status)
          ? (status as PipelineStatus)
          : null,
    };
  }
  return {
    ...common,
    recurrence: optStr(fd, "recurrence"),
    birthday: optStr(fd, "birthday"),
  };
}

// ── Contacts ────────────────────────────────────────────────────────────────
export async function createContactAction(
  _prev: CrmFormState,
  fd: FormData,
): Promise<CrmFormState> {
  await requireModule("crm");
  const type = str(fd, "type") as ContactType;
  if (!CONTACT_TYPES.includes(type)) return { ok: false, error: "Type invalide." };
  if (!str(fd, "name")) return { ok: false, error: "Le nom est requis." };

  let id: string;
  try {
    const contact = await createContact(buildInput(fd, type));
    id = contact.id;
  } catch {
    return { ok: false, error: "Création impossible. Réessayez." };
  }
  revalidatePath("/crm");
  redirect(`/crm/${id}`);
}

export async function updateContactAction(
  _prev: CrmFormState,
  fd: FormData,
): Promise<CrmFormState> {
  await requireModule("crm");
  const id = str(fd, "contactId");
  const type = str(fd, "type") as ContactType;
  if (!id) return { ok: false, error: "Contact introuvable." };
  if (!CONTACT_TYPES.includes(type)) return { ok: false, error: "Type invalide." };
  if (!str(fd, "name")) return { ok: false, error: "Le nom est requis." };

  try {
    await updateContact(id, buildInput(fd, type));
  } catch {
    return { ok: false, error: "Mise à jour impossible." };
  }
  revalidatePath("/crm");
  revalidatePath(`/crm/${id}`);
  return OK;
}

export async function deleteContactAction(fd: FormData): Promise<void> {
  await requireModule("crm");
  const id = str(fd, "contactId");
  if (id) {
    try {
      await deleteContact(id);
    } catch {
      /* suppression best-effort */
    }
  }
  revalidatePath("/crm");
  redirect("/crm");
}

// ── Activités ───────────────────────────────────────────────────────────────
export async function addActivityAction(
  _prev: CrmFormState,
  fd: FormData,
): Promise<CrmFormState> {
  await requireModule("crm");
  const contactId = str(fd, "contactId");
  const type = str(fd, "type") as ActivityType;
  const content = str(fd, "content");
  if (!contactId) return { ok: false, error: "Contact introuvable." };
  if (!ACTIVITY_TYPES.includes(type)) return { ok: false, error: "Type invalide." };
  if (!content) return { ok: false, error: "Le contenu est requis." };

  try {
    await addActivity(contactId, { type, content });
  } catch {
    return { ok: false, error: "Ajout impossible." };
  }
  revalidatePath(`/crm/${contactId}`);
  // Objet frais (identité distincte) → le composer se réinitialise après ajout.
  return { ok: true, error: null };
}

// ── Leads ─────────────────────────────────────────────────────────────────--
export async function convertLeadAction(fd: FormData): Promise<void> {
  await requireModule("crm");
  const leadId = str(fd, "leadId");
  const type = (str(fd, "type") as ContactType) || "b2c";
  if (!leadId || !CONTACT_TYPES.includes(type)) redirect("/crm/leads");

  let contactId: string;
  try {
    const contact = await convertLeadToContact(leadId, { type });
    contactId = contact.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const code =
      msg === "ALREADY_CONVERTED" ? "exists" : msg === "NOT_FOUND" ? "missing" : "error";
    revalidatePath("/crm/leads");
    redirect(`/crm/leads?convert=${code}`);
  }
  revalidatePath("/crm/leads");
  revalidatePath("/crm");
  redirect(`/crm/${contactId}`);
}

export async function updateLeadStatusAction(fd: FormData): Promise<void> {
  await requireModule("crm");
  const id = str(fd, "leadId");
  const status = str(fd, "status") as LeadStatus;
  if (id && LEAD_STATUSES.includes(status)) {
    try {
      await updateLeadStatus(id, status);
    } catch {
      /* best-effort */
    }
  }
  revalidatePath("/crm/leads");
}
