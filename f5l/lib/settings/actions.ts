"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/require-module";
import { updateOrgSettings } from "@/lib/settings/org";
import {
  updateMyPassword,
  updateMyProfile,
} from "@/lib/settings/profile";
import {
  createInvitation,
  removeMember,
  revokeInvitation,
} from "@/lib/settings/members";
import { applyFormulaChange } from "@/lib/settings/subscription";
import { FORMULA_ORDER } from "@/lib/billing/formulas";
import type { Formula, ProfileRole } from "@/types/database";

export interface SettingsFormState {
  ok: boolean;
  error: string | null;
}

const ROLES: ProfileRole[] = ["owner", "staff"];

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function optStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

// ── Organisation ────────────────────────────────────────────────────────────
export async function saveOrgSettingsAction(
  _prev: SettingsFormState,
  fd: FormData,
): Promise<SettingsFormState> {
  await requireAuth();
  const name = str(fd, "name");
  if (!name) return { ok: false, error: "Le nom est requis." };
  try {
    await updateOrgSettings({
      name,
      sector: optStr(fd, "sector"),
      contact_phone: optStr(fd, "contact_phone"),
      contact_email: optStr(fd, "contact_email"),
    });
  } catch {
    return { ok: false, error: "Enregistrement impossible." };
  }
  revalidatePath("/settings/org");
  revalidatePath("/", "layout");
  return { ok: true, error: null };
}

// ── Profil ──────────────────────────────────────────────────────────────────
export async function saveProfileAction(
  _prev: SettingsFormState,
  fd: FormData,
): Promise<SettingsFormState> {
  await requireAuth();
  const full_name = optStr(fd, "full_name");
  try {
    await updateMyProfile({ full_name });
  } catch {
    return { ok: false, error: "Enregistrement impossible." };
  }
  revalidatePath("/settings/profile");
  revalidatePath("/");
  return { ok: true, error: null };
}

export async function changePasswordAction(
  _prev: SettingsFormState,
  fd: FormData,
): Promise<SettingsFormState> {
  await requireAuth();
  const pwd = str(fd, "password");
  if (pwd.length < 8) return { ok: false, error: "8 caractères minimum." };
  try {
    await updateMyPassword(pwd);
  } catch {
    return { ok: false, error: "Changement impossible." };
  }
  return { ok: true, error: null };
}

// ── Membres ─────────────────────────────────────────────────────────────────
export async function inviteMemberAction(
  _prev: SettingsFormState,
  fd: FormData,
): Promise<SettingsFormState> {
  await requireAuth();
  const email = str(fd, "email").toLowerCase();
  const role = (str(fd, "role") || "staff") as ProfileRole;
  if (!email) return { ok: false, error: "E-mail requis." };
  if (!ROLES.includes(role)) return { ok: false, error: "Rôle invalide." };
  try {
    await createInvitation(email, role);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("duplicate")) return { ok: false, error: "Déjà invité." };
    return { ok: false, error: "Invitation impossible." };
  }
  revalidatePath("/settings/members");
  return { ok: true, error: null };
}

export async function revokeInvitationAction(fd: FormData): Promise<void> {
  await requireAuth();
  const id = str(fd, "invitationId");
  if (id) {
    try {
      await revokeInvitation(id);
    } catch {
      /* best-effort */
    }
  }
  revalidatePath("/settings/members");
}

export async function removeMemberAction(fd: FormData): Promise<void> {
  await requireAuth();
  const id = str(fd, "profileId");
  if (id) {
    try {
      await removeMember(id);
    } catch {
      /* best-effort */
    }
  }
  revalidatePath("/settings/members");
}

// ── Souscription ────────────────────────────────────────────────────────────
export async function changeFormulaAction(
  _prev: SettingsFormState,
  fd: FormData,
): Promise<SettingsFormState> {
  await requireAuth();
  const formula = str(fd, "formula") as Formula;
  if (!FORMULA_ORDER.includes(formula)) return { ok: false, error: "Formule invalide." };
  try {
    await applyFormulaChange(formula);
  } catch {
    return { ok: false, error: "Changement impossible." };
  }
  revalidatePath("/settings/billing");
  revalidatePath("/", "layout");
  return { ok: true, error: null };
}

