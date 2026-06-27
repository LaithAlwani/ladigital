import { v } from "convex/values";
import {
  action,
  query,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { verifyOpen } from "./slots";

// ----------------------------------------------------------------------------
// Bookings — data layer. Slot validity is re-checked inside each mutation's
// transaction (via verifyOpen) so concurrent clients can't double-book. The
// Google Calendar side-effects + emails are orchestrated by the Next server
// action; this file only touches the database.
// ----------------------------------------------------------------------------

export type CreateResult =
  | { ok: true; bookingId: string; manageToken: string; startUtc: number; endUtc: number }
  | { ok: false; reason: string };

export const create = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    notes: v.optional(v.string()),
    startUtc: v.number(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CreateResult> => {
    const check = await verifyOpen(ctx, args.startUtc);
    if (!check.ok) return { ok: false, reason: check.reason ?? "That slot is unavailable." };

    const manageToken = crypto.randomUUID();
    const bookingId = await ctx.db.insert("bookings", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      company: args.company,
      notes: args.notes,
      startUtc: args.startUtc,
      endUtc: check.endUtc,
      status: "confirmed",
      manageToken,
      source: args.source ?? "web",
      createdAt: Date.now(),
    });
    return { ok: true, bookingId, manageToken, startUtc: args.startUtc, endUtc: check.endUtc };
  },
});

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("bookings")
      .withIndex("by_token", (q) => q.eq("manageToken", args.token))
      .unique();
  },
});

/** Internal — used by the Google action to read a booking by id. */
export const getById = internalQuery({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => ctx.db.get(args.bookingId),
});

/** Internal — the Google action patches the event id + Meet link back on. */
export const setGoogleEvent = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    googleEventId: v.optional(v.string()),
    meetLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, {
      googleEventId: args.googleEventId,
      meetLink: args.meetLink,
    });
  },
});

export const clearGoogleEvent = internalMutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, { googleEventId: undefined, meetLink: undefined });
  },
});

export type RescheduleResult =
  | {
      ok: true;
      bookingId: string;
      googleEventId?: string;
      startUtc: number;
      endUtc: number;
      previousStartUtc: number;
    }
  | { ok: false; reason: string };

export const reschedule = internalMutation({
  args: { token: v.string(), startUtc: v.number() },
  handler: async (ctx, args): Promise<RescheduleResult> => {
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_token", (q) => q.eq("manageToken", args.token))
      .unique();
    if (!booking) return { ok: false, reason: "Booking not found." };
    if (booking.status === "cancelled")
      return { ok: false, reason: "This booking was cancelled." };

    const check = await verifyOpen(ctx, args.startUtc, booking._id);
    if (!check.ok) return { ok: false, reason: check.reason ?? "That slot is unavailable." };

    const previousStartUtc = booking.startUtc;
    await ctx.db.patch(booking._id, {
      startUtc: args.startUtc,
      endUtc: check.endUtc,
      status: "rescheduled",
    });
    return {
      ok: true,
      bookingId: booking._id,
      googleEventId: booking.googleEventId,
      startUtc: args.startUtc,
      endUtc: check.endUtc,
      previousStartUtc,
    };
  },
});

export type CancelResult =
  | { ok: true; bookingId: string; googleEventId?: string }
  | { ok: false; reason: string };

export const cancel = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<CancelResult> => {
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_token", (q) => q.eq("manageToken", args.token))
      .unique();
    if (!booking) return { ok: false, reason: "Booking not found." };
    if (booking.status === "cancelled")
      return { ok: true, bookingId: booking._id, googleEventId: booking.googleEventId };

    await ctx.db.patch(booking._id, { status: "cancelled" });
    return { ok: true, bookingId: booking._id, googleEventId: booking.googleEventId };
  },
});

/** Admin (Phase 2) — bookings within a date range, soonest first. */
export const listRange = query({
  args: { fromUtc: v.number(), toUtc: v.number() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("bookings")
      .withIndex("by_start", (q) => q.gte("startUtc", args.fromUtc).lte("startUtc", args.toUtc))
      .collect();
  },
});

// ---------------------------------------------------------------------------
// Public orchestration actions. These are the only booking entry points the
// Next server actions call (internal.* functions aren't reachable from the
// Next/Convex client API). Each runs the transactional mutation, then the
// Google Calendar side-effect, and returns everything the Next layer needs to
// send the on-brand email.
// ---------------------------------------------------------------------------

export type BookResult =
  | {
      ok: true;
      manageToken: string;
      startUtc: number;
      endUtc: number;
      meetLink?: string;
      calendarConnected: boolean;
    }
  | { ok: false; reason: string };

export const book = action({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    notes: v.optional(v.string()),
    startUtc: v.number(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<BookResult> => {
    const created: CreateResult = await ctx.runMutation(internal.bookings.create, args);
    if (!created.ok) return { ok: false, reason: created.reason };

    // The booking is already saved. A calendar failure (disconnected, expired
    // token, API hiccup) must NEVER fail the booking — we still return ok so
    // the visitor sees success and both confirmation emails are sent. The
    // event just won't have a Meet link until the calendar is reconnected.
    let ev: { connected: boolean; meetLink?: string } = { connected: false };
    try {
      ev = await ctx.runAction(internal.google.insertEvent, {
        bookingId: created.bookingId as Id<"bookings">,
      });
    } catch (err) {
      console.error("[bookings.book] calendar insert failed (non-fatal)", err);
    }
    return {
      ok: true,
      manageToken: created.manageToken,
      startUtc: created.startUtc,
      endUtc: created.endUtc,
      meetLink: ev.meetLink,
      calendarConnected: ev.connected,
    };
  },
});

export type RebookResult =
  | { ok: true; startUtc: number; endUtc: number; previousStartUtc: number }
  | { ok: false; reason: string };

export const rebook = action({
  args: { token: v.string(), startUtc: v.number() },
  handler: async (ctx, args): Promise<RebookResult> => {
    const res: RescheduleResult = await ctx.runMutation(internal.bookings.reschedule, args);
    if (!res.ok) return { ok: false, reason: res.reason };
    try {
      await ctx.runAction(internal.google.patchEvent, {
        bookingId: res.bookingId as Id<"bookings">,
      });
    } catch (err) {
      console.error("[bookings.rebook] calendar patch failed (non-fatal)", err);
    }
    return {
      ok: true,
      startUtc: res.startUtc,
      endUtc: res.endUtc,
      previousStartUtc: res.previousStartUtc,
    };
  },
});

export type UnbookResult = { ok: true } | { ok: false; reason: string };

export const unbook = action({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<UnbookResult> => {
    const res: CancelResult = await ctx.runMutation(internal.bookings.cancel, args);
    if (!res.ok) return { ok: false, reason: res.reason };
    if (res.googleEventId) {
      try {
        await ctx.runAction(internal.google.deleteEvent, { googleEventId: res.googleEventId });
      } catch (err) {
        console.error("[bookings.unbook] calendar delete failed (non-fatal)", err);
      }
    }
    return { ok: true };
  },
});
