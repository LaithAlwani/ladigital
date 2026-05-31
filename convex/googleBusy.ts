import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// ----------------------------------------------------------------------------
// Cached free/busy intervals from the owner's Google Calendar. The cron action
// fetches them and calls `replaceAll`; the slot query reads them so it never
// blocks on the Google API.
// ----------------------------------------------------------------------------

export const all = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("googleBusy").collect(),
});

export const replaceAll = internalMutation({
  args: {
    intervals: v.array(v.object({ startUtc: v.number(), endUtc: v.number() })),
    syncedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Small table (a few weeks of events) — clear and rewrite.
    const existing = await ctx.db.query("googleBusy").collect();
    for (const row of existing) await ctx.db.delete(row._id);
    for (const iv of args.intervals) {
      await ctx.db.insert("googleBusy", {
        startUtc: iv.startUtc,
        endUtc: iv.endUtc,
        syncedAt: args.syncedAt,
      });
    }
  },
});
