"use server";

import { revalidatePath } from "next/cache";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { isAdmin, adminWriteKey } from "@/lib/admin-session";

type Unit = "one-time" | "per-month" | "per-project";

export type PlanInput = {
  slug?: string;
  name: string;
  tagline?: string;
  price: number;
  unit?: Unit;
  setupFee?: number;
  setupWaivedAnnual?: boolean;
  features: string[];
  notes?: string[];
  highlight?: boolean;
  ctaLabel?: string;
};

export async function savePlans(categoryId: string, plans: PlanInput[]): Promise<void> {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await fetchMutation(api.plans.replaceCategory, {
    adminKey: adminWriteKey(),
    categoryId,
    plans,
  });
  revalidatePath("/");
  revalidatePath("/services");
}
