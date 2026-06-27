import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { invoiceStatus } from "./schema";
import { assertAdmin } from "./lib/requireAdmin";

const DAY = 86_400_000;

const itemsV = v.array(v.object({ description: v.string(), amount: v.number() }));

const invoiceFields = {
  clientName: v.string(),
  clientCompany: v.optional(v.string()),
  clientEmail: v.optional(v.string()),
  clientAddress: v.optional(v.string()),
  items: itemsV,
  taxRate: v.number(),
  currency: v.string(),
  issueDate: v.number(),
  dueInDays: v.number(),
  notes: v.optional(v.string()),
  status: invoiceStatus,
};

async function nextNumber(ctx: QueryCtx): Promise<string> {
  const all = await ctx.db.query("invoices").collect();
  let max = 1000;
  for (const inv of all) {
    const m = inv.number.match(/(\d+)\s*$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `INV-${max + 1}`;
}

export const listAdmin = query({
  args: { adminKey: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminKey);
    return ctx.db.query("invoices").withIndex("by_created").order("desc").collect();
  },
});

export const getAdmin = query({
  args: { adminKey: v.string(), id: v.id("invoices") },
  handler: async (ctx, args) => {
    assertAdmin(args.adminKey);
    return ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: { adminKey: v.string(), ...invoiceFields },
  handler: async (ctx, args): Promise<Id<"invoices">> => {
    assertAdmin(args.adminKey);
    const { adminKey: _k, ...data } = args;
    const number = await nextNumber(ctx);
    return ctx.db.insert("invoices", {
      ...data,
      number,
      dueDate: data.issueDate + data.dueInDays * DAY,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: { adminKey: v.string(), id: v.id("invoices"), ...invoiceFields },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    const { adminKey: _k, id, ...data } = args;
    await ctx.db.patch(id, {
      ...data,
      dueDate: data.issueDate + data.dueInDays * DAY,
    });
  },
});

export const setStatus = mutation({
  args: { adminKey: v.string(), id: v.id("invoices"), status: invoiceStatus },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: { adminKey: v.string(), id: v.id("invoices") },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    await ctx.db.delete(args.id);
  },
});

/** Create a blank draft and return its id (admin clicks "New invoice"). */
export const createBlank = mutation({
  args: { adminKey: v.string() },
  handler: async (ctx, args): Promise<Id<"invoices">> => {
    assertAdmin(args.adminKey);
    const number = await nextNumber(ctx);
    const now = Date.now();
    return ctx.db.insert("invoices", {
      number,
      clientName: "",
      items: [{ description: "", amount: 0 }],
      taxRate: 13,
      currency: "CAD",
      issueDate: now,
      dueInDays: 14,
      dueDate: now + 14 * DAY,
      status: "draft",
      createdAt: now,
    });
  },
});
