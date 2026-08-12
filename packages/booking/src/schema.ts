import { defineTable } from "convex/server";
import { v } from "convex/values";

// ----------------------------------------------------------------------------
// @ladigital/booking schema — the booking + Google Calendar table fragments a
// client app spreads into its own Convex schema (`...bookingTables`). Data is
// isolated per client because each app has its own Convex deployment.
// ----------------------------------------------------------------------------

export const bookingStatus = v.union(
  v.literal("confirmed"),
  v.literal("rescheduled"),
  v.literal("cancelled"),
);

export const bookingTables = {
  // A booking. `manageToken` lets the client reschedule/cancel via an emailed
  // link without authentication.
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
    // Set once the pre-appointment reminder email has been sent (dedupe).
    reminderSentAt: v.optional(v.number()),
  })
    .index("by_start", ["startUtc"])
    .index("by_token", ["manageToken"]),

  // Singleton — the owner's bookable-hours configuration. If absent, the app
  // falls back to makeDefaultRules() (see @ladigital/booking).
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
};
