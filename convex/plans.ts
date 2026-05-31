import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { priceUnit } from "./schema";
import { assertAdmin } from "./lib/requireAdmin";

// Editable plans. A category's plans live here once the admin saves them;
// otherwise the public site falls back to the static packages in site-config.

const planInput = v.object({
  slug: v.optional(v.string()),
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
});

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "plan"
  );
}

export const getPublic = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("plans").collect();
    return docs.sort((a, b) => a.order - b.order);
  },
});

export const replaceCategory = mutation({
  args: { adminKey: v.string(), categoryId: v.string(), plans: v.array(planInput) },
  handler: async (ctx, args) => {
    assertAdmin(args.adminKey);
    const existing = await ctx.db
      .query("plans")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();
    for (const row of existing) await ctx.db.delete(row._id);

    const used = new Set<string>();
    for (let i = 0; i < args.plans.length; i += 1) {
      const p = args.plans[i];
      const base = (p.slug && p.slug.trim()) || slugify(p.name);
      let slug = base;
      let n = 1;
      while (used.has(slug)) {
        n += 1;
        slug = `${base}-${n}`;
      }
      used.add(slug);
      await ctx.db.insert("plans", {
        categoryId: args.categoryId,
        slug,
        name: p.name,
        tagline: p.tagline,
        price: p.price,
        unit: p.unit,
        setupFee: p.setupFee,
        setupWaivedAnnual: p.setupWaivedAnnual,
        features: p.features,
        notes: p.notes,
        highlight: p.highlight,
        ctaLabel: p.ctaLabel,
        order: i,
      });
    }
  },
});
