import { v } from "convex/values";
import { mutation, query, internalMutation, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

// ----------------------------------------------------------------------------
// Availability rules — the owner's bookable-hours configuration (a singleton).
// If no document exists yet, DEFAULT_RULES keeps the booking page working out
// of the box. Phase 2 adds an admin UI (guarded) to edit these.
// ----------------------------------------------------------------------------

export type Rules = {
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

export const DEFAULT_RULES: Rules = {
  timezone: "America/Toronto",
  weeklyHours: [
    { weekday: 1, start: "09:00", end: "16:00" },
    { weekday: 2, start: "09:00", end: "16:00" },
    { weekday: 3, start: "09:00", end: "16:00" },
    { weekday: 4, start: "09:00", end: "16:00" },
    { weekday: 5, start: "09:00", end: "16:00" },
  ],
  slotMinutes: 30,
  durationMinutes: 30,
  // No padding by default, so consecutive calls are bookable back-to-back
  // (a 9:00–9:30 booking leaves 9:30–10:00 open). The admin can add buffers
  // later if breathing room between calls is wanted.
  bufferBefore: 0,
  bufferAfter: 0,
  minNoticeHours: 12,
  maxAdvanceDays: 21,
  meetingTitle: "Discovery call — LA Digital",
};

/** Read the effective rules (stored doc or defaults). Used internally + by the slot query. */
export async function effectiveRules(ctx: QueryCtx): Promise<Rules> {
  const doc = await ctx.db.query("availabilityRules").first();
  if (!doc) return DEFAULT_RULES;
  const { _id, _creationTime, ...rules } = doc as Doc<"availabilityRules">;
  return rules;
}

export const getRules = query({
  args: {},
  handler: async (ctx): Promise<Rules> => effectiveRules(ctx),
});

const rulesArgs = {
  timezone: v.string(),
  weeklyHours: v.array(
    v.object({ weekday: v.number(), start: v.string(), end: v.string() }),
  ),
  slotMinutes: v.number(),
  durationMinutes: v.number(),
  bufferBefore: v.number(),
  bufferAfter: v.number(),
  minNoticeHours: v.number(),
  maxAdvanceDays: v.number(),
  meetingTitle: v.string(),
};

/**
 * Set the availability rules. Internal for Phase 1 (call from the Convex
 * dashboard to initialize); Phase 2 exposes a `requireAdmin`-guarded version.
 */
export const setRules = internalMutation({
  args: rulesArgs,
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("availabilityRules").first();
    if (existing) {
      await ctx.db.replace(existing._id, args);
      return existing._id;
    }
    return ctx.db.insert("availabilityRules", args);
  },
});

export const listBlackouts = query({
  args: {},
  handler: async (ctx) => ctx.db.query("blackoutDates").collect(),
});

export const addBlackout = internalMutation({
  args: { startDate: v.string(), endDate: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => ctx.db.insert("blackoutDates", args),
});
