import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdmin } from "./lib/requireAdmin";

// Editable site content overrides (singleton). Public reads are reactive; the
// site falls back to lib/site-config.ts for anything unset. Writes are guarded
// by the shared admin write key.

const companyV = v.optional(
  v.object({
    name: v.optional(v.string()),
    tagline: v.optional(v.string()),
    heroHeadline: v.optional(v.string()),
    heroSubheadline: v.optional(v.string()),
    description: v.optional(v.string()),
  }),
);
const contactV = v.optional(
  v.object({
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    region: v.optional(v.string()),
    businessHours: v.optional(v.string()),
  }),
);
const pricingV = v.optional(
  v.object({
    setupFee: v.optional(v.number()),
    annualPromoLine: v.optional(v.string()),
    setupWaivedAnnual: v.optional(v.boolean()),
  }),
);
const offerV = v.optional(
  v.object({
    enabled: v.boolean(),
    label: v.optional(v.string()),
    text: v.optional(v.string()),
  }),
);
const packagePricesV = v.optional(v.array(v.object({ id: v.string(), price: v.number() })));
const socialsV = v.optional(
  v.array(
    v.object({
      platform: v.string(),
      url: v.string(),
      handle: v.optional(v.string()),
      enabled: v.optional(v.boolean()),
    }),
  ),
);

export const getPublic = query({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "site"))
      .unique();
    if (!doc) return null;
    return {
      company: doc.company,
      contact: doc.contact,
      pricing: doc.pricing,
      offer: doc.offer,
      socials: doc.socials,
      packagePrices: doc.packagePrices,
    };
  },
});

export const update = mutation({
  args: {
    adminKey: v.string(),
    company: companyV,
    contact: contactV,
    pricing: pricingV,
    offer: offerV,
    socials: socialsV,
    packagePrices: packagePricesV,
  },
  handler: async (ctx, args) => {
    assertAdmin(args.adminKey);
    const { adminKey: _k, ...fields } = args;
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "site"))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("settings", { key: "site", ...fields });
    }
  },
});
