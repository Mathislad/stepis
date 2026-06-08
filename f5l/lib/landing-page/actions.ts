"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/require-module";
import {
  saveLandingPage,
  type LandingHero,
  type LandingHours,
  type LandingInfo,
  type LandingService,
  type LandingTestimonial,
} from "@/lib/landing-page/page";

export interface LandingFormState {
  ok: boolean;
  error: string | null;
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

const WEEK_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export async function saveLandingPageAction(
  _prev: LandingFormState,
  fd: FormData,
): Promise<LandingFormState> {
  const ctx = await requireAuth();

  const hero: LandingHero = {
    title: str(fd, "hero_title") || "Bienvenue",
    subtitle: str(fd, "hero_subtitle"),
    ctaLabel: str(fd, "hero_cta") || "Nous contacter",
  };

  const services: LandingService[] = [];
  for (let i = 0; i < 6; i++) {
    const title = str(fd, `service_${i}_title`);
    const description = str(fd, `service_${i}_description`);
    if (title || description) services.push({ title, description });
  }

  const testimonials: LandingTestimonial[] = [];
  for (let i = 0; i < 3; i++) {
    const author = str(fd, `testimonial_${i}_author`);
    const quote = str(fd, `testimonial_${i}_quote`);
    if (author || quote) testimonials.push({ author, quote });
  }

  const hours: LandingHours = {
    days: WEEK_DAYS.map((label, i) => ({
      label,
      open: str(fd, `day_${i}_open`) || "09:00",
      close: str(fd, `day_${i}_close`) || "18:00",
      closed: fd.get(`day_${i}_closed`) === "on",
    })),
  };

  const info: LandingInfo = {
    address: str(fd, "info_address"),
    city: str(fd, "info_city"),
    phone: str(fd, "info_phone"),
  };

  const published = fd.get("published") === "on";

  try {
    await saveLandingPage({
      hero,
      services,
      testimonials,
      hours,
      info,
      published,
    });
  } catch {
    return { ok: false, error: "Enregistrement impossible." };
  }
  revalidatePath("/ma-page");
  revalidatePath(`/p/${ctx.org.slug}`);
  return { ok: true, error: null };
}
