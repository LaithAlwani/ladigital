import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { bookingTables } from "@ladigital/booking/schema";
import { crmTables } from "@ladigital/crm/schema";

// ----------------------------------------------------------------------------
// Schema — booking + Google Calendar + editable site content + CRM.
// The booking tables come from @ladigital/booking (`...bookingTables`) and the
// CRM tables (clients, invoices, contacts, deals, activities, tasks) from
// @ladigital/crm (`...crmTables`), so every client app shares them.
// ----------------------------------------------------------------------------

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
          enabled: v.optional(v.boolean()),
        }),
      ),
    ),
    // Per-package price overrides, keyed by the package id in site-config.
    // (Legacy — plan prices now live in the `plans` table. Kept for back-compat.)
    packagePrices: v.optional(v.array(v.object({ id: v.string(), price: v.number() }))),
  }).index("by_key", ["key"]),

  // Editable plans/packages, grouped by the static service category id
  // ("plans" | "addons"). When a category has rows here
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

  // Booking + Google Calendar (bookings, availabilityRules, blackoutDates,
  // googleTokens, googleBusy). Shared table definitions from @ladigital/booking.
  ...bookingTables,

  // CRM — clients + invoices + leads/pipeline (contacts, deals, activities,
  // tasks). Shared table definitions from @ladigital/crm.
  ...crmTables,
});
