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

export const projectStatus = v.union(
  v.literal("live"),
  v.literal("under-construction"),
  v.literal("legacy"),
  v.literal("retired"),
  v.literal("private"),
);

export const priceUnit = v.union(
  v.literal("one-time"),
  v.literal("per-month"),
  v.literal("per-project"),
);

export default defineSchema({
  // Editable site content overrides (a singleton, key="site"). The public site
  // reads these reactively and falls back to lib/site-config.ts for any field
  // left unset, so edits go live without a redeploy.
  settings: defineTable({
    key: v.literal("site"),
    company: v.optional(
      v.object({
        name: v.optional(v.string()),
        tagline: v.optional(v.string()),
        heroHeadline: v.optional(v.string()),
        heroSubheadline: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    ),
    contact: v.optional(
      v.object({
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
        businessHours: v.optional(v.string()),
      }),
    ),
    pricing: v.optional(
      v.object({
        setupFee: v.optional(v.number()),
        annualPromoLine: v.optional(v.string()),
        setupWaivedAnnual: v.optional(v.boolean()),
      }),
    ),
    // Promo / discount banner.
    offer: v.optional(
      v.object({
        enabled: v.boolean(),
        label: v.optional(v.string()),
        text: v.optional(v.string()),
      }),
    ),
    // Social links shown in the footer.
    socials: v.optional(
      v.array(
        v.object({
          platform: v.string(),
          url: v.string(),
          handle: v.optional(v.string()),
        }),
      ),
    ),
    // Per-package price overrides, keyed by the package id in site-config.
    // (Legacy — plan prices now live in the `plans` table. Kept for back-compat.)
    packagePrices: v.optional(v.array(v.object({ id: v.string(), price: v.number() }))),
  }).index("by_key", ["key"]),

  // Editable plans/packages, grouped by the static service category id
  // ("plans" | "growth-services" | "addons"). When a category has rows here
  // they are the source of truth; otherwise the public site falls back to the
  // static packages in lib/site-config.ts.
  plans: defineTable({
    categoryId: v.string(),
    slug: v.string(), // stable package id, used in deep links
    name: v.string(),
    tagline: v.optional(v.string()),
    price: v.number(),
    unit: v.optional(priceUnit),
    setupFee: v.optional(v.number()),
    setupWaivedAnnual: v.optional(v.boolean()),
    features: v.array(v.string()),
    notes: v.optional(v.array(v.string())),
    highlight: v.optional(v.boolean()),
    ctaLabel: v.optional(v.string()),
    order: v.number(),
  }).index("by_category", ["categoryId"]),

  // Portfolio projects — admin-managed, shown in the public "Selected work"
  // section and /work pages.
  projects: defineTable({
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.string(),
    images: v.array(v.object({ storageId: v.id("_storage"), alt: v.optional(v.string()) })),
    coverIndex: v.number(), // index into images[] used as the card cover
    slug: v.string(),
    url: v.optional(v.string()), // external live link (shown for live/legacy)
    status: projectStatus,
    order: v.number(),
    published: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"]),

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
