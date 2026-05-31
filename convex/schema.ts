import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ----------------------------------------------------------------------------
// Phase 1 schema — booking + Google Calendar.
// Later phases add: settings, theme, media, services, packages, analytics.
// ----------------------------------------------------------------------------

export const bookingStatus = v.union(
  v.literal("confirmed"),
  v.literal("rescheduled"),
  v.literal("cancelled"),
);

export default defineSchema({
  // A discovery-call booking. `manageToken` lets the client reschedule/cancel
  // via an emailed link without authentication.
  bookings: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    notes: v.optional(v.string()),
    startUtc: v.number(), // epoch ms
    endUtc: v.number(), // epoch ms
    status: bookingStatus,
    googleEventId: v.optional(v.string()),
    meetLink: v.optional(v.string()),
    manageToken: v.string(),
    source: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_start", ["startUtc"])
    .index("by_token", ["manageToken"]),

  // Singleton — the owner's bookable-hours configuration. If absent, the app
  // falls back to DEFAULT_RULES (see convex/availability.ts).
  availabilityRules: defineTable({
    timezone: v.string(), // IANA, e.g. "America/Toronto"
    weeklyHours: v.array(
      v.object({
        weekday: v.number(), // 0=Sun … 6=Sat
        start: v.string(), // "09:00"
        end: v.string(), // "16:00"
      }),
    ),
    slotMinutes: v.number(), // granularity of the slot grid
    durationMinutes: v.number(), // length of the call
    bufferBefore: v.number(), // minutes of padding before an existing event
    bufferAfter: v.number(), // minutes after
    minNoticeHours: v.number(), // earliest bookable lead time
    maxAdvanceDays: v.number(), // furthest bookable day
    meetingTitle: v.string(),
  }),

  // Specific days (or ranges) the owner is unavailable.
  blackoutDates: defineTable({
    startDate: v.string(), // "YYYY-MM-DD" (business tz), inclusive
    endDate: v.string(), // "YYYY-MM-DD", inclusive
    reason: v.optional(v.string()),
  }).index("by_endDate", ["endDate"]),

  // Singleton — OAuth tokens for the owner's Google Calendar.
  googleTokens: defineTable({
    accessToken: v.string(),
    refreshToken: v.string(),
    expiryDate: v.number(), // epoch ms
    scope: v.optional(v.string()),
    calendarId: v.string(), // usually "primary"
  }),

  // Cached busy intervals pulled from the owner's calendar by cron, so the
  // slot query stays pure/fast and never blocks on the Google API.
  googleBusy: defineTable({
    startUtc: v.number(),
    endUtc: v.number(),
    syncedAt: v.number(),
  }).index("by_start", ["startUtc"]),
});
