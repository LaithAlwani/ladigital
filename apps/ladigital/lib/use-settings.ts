"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Reactive read of the editable site overrides. Returns `undefined` while
// loading (so first client render matches SSR and uses static fallbacks),
// `null` when nothing is set, or the override object.
export function useSettings() {
  return useQuery(api.settings.getPublic, {});
}

export type SiteSettings = NonNullable<ReturnType<typeof useSettings>>;

/** Resolve a package's price: admin override if present, else the static fallback. */
export function packagePrice(
  settings: SiteSettings | null | undefined,
  id: string,
  fallback: number,
): number {
  const override = settings?.packagePrices?.find((p) => p.id === id)?.price;
  return typeof override === "number" ? override : fallback;
}
