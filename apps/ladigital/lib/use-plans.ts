"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { ServiceCategory, ServicePackage } from "@/lib/types";

// Reactive read of editable plans. Returns `undefined` while loading (so first
// client render matches the SSR fallback to static config), then an array.
export function usePlans() {
  return useQuery(api.plans.getPublic, {});
}

export type PlanRows = NonNullable<ReturnType<typeof usePlans>>;

/**
 * The effective packages for a category: Convex-backed plans when the category
 * has any, otherwise the static packages from site-config.
 */
export function effectivePackages(
  category: ServiceCategory,
  plans: PlanRows | undefined,
): ServicePackage[] {
  if (!plans) return category.packages;
  const rows = plans
    .filter((p) => p.categoryId === category.id)
    .sort((a, b) => a.order - b.order);
  if (rows.length === 0) return category.packages;
  return rows.map((r) => ({
    id: r.slug,
    name: r.name,
    tagline: r.tagline,
    price: r.price,
    currency: "CAD" as const,
    unit: r.unit,
    setupFee: r.setupFee,
    setupWaivedAnnual: r.setupWaivedAnnual,
    features: r.features,
    notes: r.notes,
    highlight: r.highlight,
    ctaLabel: r.ctaLabel,
  }));
}

/** Cheapest non-menu package in a list (used for "from $X" at-a-glance). */
export function cheapestPackage(packages: ServicePackage[]): ServicePackage | undefined {
  return [...packages].filter((p) => !p.options).sort((a, b) => a.price - b.price)[0];
}
