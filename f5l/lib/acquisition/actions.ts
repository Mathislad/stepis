"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireModule } from "@/lib/auth/require-module";
import {
  createAdCampaign,
  deleteAdCampaign,
  updateAdCampaign,
} from "@/lib/acquisition/campaigns";
import { generateAdCopy } from "@/lib/acquisition/generate";
import type { AdCampaignStatus, AdObjective, AdPlatform } from "@/types/database";

export interface AcquisitionFormState {
  ok: boolean;
  error: string | null;
  adCopy?: string | null;
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function num(fd: FormData, key: string, fallback: number): number {
  const v = Number.parseFloat(str(fd, key));
  return Number.isFinite(v) ? v : fallback;
}

const OBJECTIVES: AdObjective[] = ["visibility", "leads", "promo"];
const PLATFORMS: AdPlatform[] = ["meta", "google", "both"];
const STATUSES: AdCampaignStatus[] = ["draft", "active", "paused", "completed"];

export async function createAdCampaignAction(
  _prev: AcquisitionFormState,
  fd: FormData,
): Promise<AcquisitionFormState> {
  await requireModule("acquisition");
  const title = str(fd, "title");
  const objective = str(fd, "objective") as AdObjective;
  const platform = (str(fd, "platform") || "both") as AdPlatform;
  const budget = num(fd, "budget", 0);
  const duration_days = Math.max(1, Math.round(num(fd, "duration_days", 30)));
  const ad_copy = str(fd, "ad_copy");

  if (!title || title.length > 200) return { ok: false, error: "Titre requis (200 caractères max)." };
  if (!OBJECTIVES.includes(objective)) return { ok: false, error: "Objectif invalide." };
  if (!PLATFORMS.includes(platform)) return { ok: false, error: "Plateforme invalide." };
  if (budget < 0) return { ok: false, error: "Budget négatif impossible." };

  let campaignId: string;
  try {
    const created = await createAdCampaign({
      title,
      objective,
      platform,
      budget,
      duration_days,
      ad_copy: ad_copy || null,
    });
    campaignId = created.id;
  } catch {
    return { ok: false, error: "Création impossible." };
  }
  revalidatePath("/acquisition");
  redirect(`/acquisition/${campaignId}`);
}

export async function generateAdCopyAction(
  _prev: AcquisitionFormState,
  fd: FormData,
): Promise<AcquisitionFormState> {
  const ctx = await requireModule("acquisition");
  const objective = str(fd, "objective") as AdObjective;
  if (!OBJECTIVES.includes(objective)) return { ok: false, error: "Objectif invalide." };
  try {
    const copy = await generateAdCopy(objective, ctx.org.name, ctx.org.sector);
    return { ok: true, error: null, adCopy: copy };
  } catch {
    return { ok: false, error: "Génération impossible." };
  }
}

export async function updateAdCampaignStatusAction(fd: FormData): Promise<void> {
  await requireModule("acquisition");
  const id = str(fd, "campaignId");
  const status = str(fd, "status") as AdCampaignStatus;
  if (!id || !STATUSES.includes(status)) return;
  try {
    await updateAdCampaign(id, { status });
  } catch (e) {
    console.error("[updateAdCampaignStatusAction]", e);
  }
  revalidatePath("/acquisition");
  revalidatePath(`/acquisition/${id}`);
}

export async function deleteAdCampaignAction(fd: FormData): Promise<void> {
  await requireModule("acquisition");
  const id = str(fd, "campaignId");
  if (!id) return;
  try {
    await deleteAdCampaign(id);
  } catch {
    /* best-effort */
  }
  revalidatePath("/acquisition");
  redirect("/acquisition");
}
