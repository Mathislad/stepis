"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireModule } from "@/lib/auth/require-module";
import {
  createDocument,
  deleteDocument,
  markDocumentPaid,
  markDocumentSent,
  updateDocument,
} from "@/lib/admin/documents";
import { sendReminder } from "@/lib/admin/reminders";
import { createSignatureRequest } from "@/lib/signature/yousign";
import type {
  DocumentStatus,
  DocumentType,
  ReminderChannel,
} from "@/types/database";

export interface AdminFormState {
  ok: boolean;
  error: string | null;
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function optStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}
function num(fd: FormData, key: string): number | null {
  const raw = str(fd, key);
  if (!raw) return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

const DOC_TYPES: DocumentType[] = ["devis", "facture", "contrat"];
const STATUSES: DocumentStatus[] = ["draft", "sent", "signed", "paid", "overdue", "cancelled"];
const CHANNELS: ReminderChannel[] = ["sms", "email"];

export async function createDocumentAction(
  _prev: AdminFormState,
  fd: FormData,
): Promise<AdminFormState> {
  await requireModule("admin");
  const doc_type = str(fd, "doc_type") as DocumentType;
  const title = str(fd, "title");
  if (!DOC_TYPES.includes(doc_type)) return { ok: false, error: "Type invalide." };
  if (!title || title.length > 200) return { ok: false, error: "Titre requis (200 max)." };

  let docId: string;
  try {
    const created = await createDocument({
      doc_type,
      title,
      recipient_name: optStr(fd, "recipient_name"),
      recipient_email: optStr(fd, "recipient_email"),
      recipient_phone: optStr(fd, "recipient_phone"),
      amount: num(fd, "amount"),
      due_date: optStr(fd, "due_date"),
      content: {},
    });
    docId = created.id;
  } catch {
    return { ok: false, error: "Création impossible." };
  }
  revalidatePath("/admin");
  redirect(`/admin/${docId}`);
}

export async function updateDocumentStatusAction(fd: FormData): Promise<void> {
  await requireModule("admin");
  const id = str(fd, "documentId");
  const status = str(fd, "status") as DocumentStatus;
  if (!id || !STATUSES.includes(status)) return;
  try {
    await updateDocument(id, { status });
  } catch (e) {
    console.error("[updateDocumentStatus]", e);
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
}

export async function markPaidAction(fd: FormData): Promise<void> {
  await requireModule("admin");
  const id = str(fd, "documentId");
  if (!id) return;
  try {
    await markDocumentPaid(id);
  } catch (e) {
    console.error("[markPaid]", e);
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
}

export async function markSentAction(fd: FormData): Promise<void> {
  await requireModule("admin");
  const id = str(fd, "documentId");
  if (!id) return;
  try {
    await markDocumentSent(id);
  } catch (e) {
    console.error("[markSent]", e);
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
}

export async function sendReminderAction(
  _prev: AdminFormState,
  fd: FormData,
): Promise<AdminFormState> {
  const ctx = await requireModule("admin");
  const id = str(fd, "documentId");
  const channel = str(fd, "channel") as ReminderChannel;
  if (!id) return { ok: false, error: "Document introuvable." };
  if (!CHANNELS.includes(channel)) return { ok: false, error: "Canal invalide." };
  try {
    await sendReminder(id, channel, ctx.org.name);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "CONTACT_MISSING") {
      return { ok: false, error: `Pas de ${channel === "email" ? "courriel" : "téléphone"} renseigné.` };
    }
    return { ok: false, error: "Envoi impossible." };
  }
  revalidatePath(`/admin/${id}`);
  return { ok: true, error: null };
}

export async function requestSignatureAction(
  _prev: AdminFormState,
  fd: FormData,
): Promise<AdminFormState> {
  await requireModule("admin");
  const id = str(fd, "documentId");
  if (!id) return { ok: false, error: "Document introuvable." };
  const result = await createSignatureRequest(id);
  if (!result.configured) {
    return { ok: false, error: result.message };
  }
  if (result.signature_url) {
    try {
      await updateDocument(id, { signature_url: result.signature_url, status: "sent" });
    } catch (e) {
      console.error("[requestSignature]", e);
    }
  }
  revalidatePath(`/admin/${id}`);
  return { ok: true, error: null };
}

export async function deleteDocumentAction(fd: FormData): Promise<void> {
  await requireModule("admin");
  const id = str(fd, "documentId");
  if (!id) return;
  try {
    await deleteDocument(id);
  } catch (e) {
    console.error("[deleteDocument]", e);
  }
  revalidatePath("/admin");
  redirect("/admin");
}
