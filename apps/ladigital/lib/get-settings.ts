import "server-only";
import { cache } from "react";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

// Server-side read of the editable site settings, deduped per request via
// React cache(). Used to resolve things that must be correct on first paint
// (e.g. which social links to show) without a client-side flash.
export const getSettings = cache(async () => {
  return fetchQuery(api.settings.getPublic, {}).catch(() => null);
});
