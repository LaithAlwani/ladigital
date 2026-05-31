import { v } from "convex/values";
import { query, internalQuery, internalMutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

// ----------------------------------------------------------------------------
// Google OAuth token storage (a singleton). These are internal-only — tokens
// never leave Convex and are read/written exclusively by the "use node" Google
// actions. Keeping db access here (default runtime) lets google.ts stay Node.
// ----------------------------------------------------------------------------

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  scope?: string;
  calendarId: string;
};

/** Public — whether the owner's calendar is connected (exposes no token data). */
export const isConnected = query({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    return (await ctx.db.query("googleTokens").first()) !== null;
  },
});

export const get = internalQuery({
  args: {},
  handler: async (ctx): Promise<(StoredTokens & { _id: string }) | null> => {
    const doc = await ctx.db.query("googleTokens").first();
    if (!doc) return null;
    const d = doc as Doc<"googleTokens">;
    return {
      _id: d._id,
      accessToken: d.accessToken,
      refreshToken: d.refreshToken,
      expiryDate: d.expiryDate,
      scope: d.scope,
      calendarId: d.calendarId,
    };
  },
});

export const save = internalMutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.string(),
    expiryDate: v.number(),
    scope: v.optional(v.string()),
    calendarId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("googleTokens").first();
    if (existing) {
      await ctx.db.replace(existing._id, args);
      return existing._id;
    }
    return ctx.db.insert("googleTokens", args);
  },
});

/** Persist a refreshed access token (keeps the existing refresh token). */
export const updateAccess = internalMutation({
  args: { accessToken: v.string(), expiryDate: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("googleTokens").first();
    if (existing) await ctx.db.patch(existing._id, args);
  },
});

export const disconnect = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("googleTokens").first();
    if (existing) await ctx.db.delete(existing._id);
  },
});
