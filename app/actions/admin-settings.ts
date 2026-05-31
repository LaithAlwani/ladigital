"use server";

import { revalidatePath } from "next/cache";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isAdmin, adminWriteKey } from "@/lib/admin-session";

async function ensureAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

function bustPublic() {
  revalidatePath("/");
  revalidatePath("/services");
}

export type SettingsPayload = {
  company?: {
    name?: string;
    tagline?: string;
    heroHeadline?: string;
    heroSubheadline?: string;
    description?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    city?: string;
    region?: string;
    businessHours?: string;
  };
  pricing?: { setupFee?: number; annualPromoLine?: string; setupWaivedAnnual?: boolean };
  offer?: { enabled: boolean; label?: string; text?: string };
  socials?: { platform: string; url: string; handle?: string }[];
  packagePrices?: { id: string; price: number }[];
};

export async function updateSettings(payload: SettingsPayload): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.settings.update, { adminKey: adminWriteKey(), ...payload });
  bustPublic();
}

export type AvailabilityPayload = {
  timezone: string;
  weeklyHours: { weekday: number; start: string; end: string }[];
  slotMinutes: number;
  durationMinutes: number;
  bufferBefore: number;
  bufferAfter: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  meetingTitle: string;
};

export async function saveAvailability(rules: AvailabilityPayload): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.availability.setRulesAdmin, { adminKey: adminWriteKey(), ...rules });
}

export async function addBlackout(
  startDate: string,
  endDate: string,
  reason?: string,
): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.availability.addBlackoutAdmin, {
    adminKey: adminWriteKey(),
    startDate,
    endDate,
    reason: reason || undefined,
  });
}

export async function removeBlackout(id: string): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.availability.removeBlackout, {
    adminKey: adminWriteKey(),
    id: id as Id<"blackoutDates">,
  });
}
