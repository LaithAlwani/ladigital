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
  recurring: v.optional(v.boolean()),
};

/** Add `n` calendar months to an epoch, clamping to the last day on overflow. */
function addMonths(epoch: number, n: number): number {
  const d = new Date(epoch);
  const day = d.getDate();
  d.setMonth(d.getMonth() + n);
  if (d.getDate() < day) d.setDate(0); // e.g. Jan 31 + 1mo -> Feb 28
  return d.getTime();
}

/** First monthly occurrence strictly in the future, starting one month after issue. */
function firstFutureMonthly(issueEpoch: number): number {
  let t = addMonths(issueEpoch, 1);
  const now = Date.now();
  let guard = 0;
  while (t <= now && guard < 600) {
    t = addMonths(t, 1);
    guard += 1;
  }
  return t;
}

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
    const { adminKey: _k, id, recurring, ...rest } = args;
    const existing = await ctx.db.get(id);

    // nextRunAt: set on first enable, preserve the cron-advanced schedule while
    // it stays on, clear when turned off.
    let nextRunAt = existing?.nextRunAt;
    if (recurring) {
      if (typeof nextRunAt !== "number") nextRunAt = firstFutureMonthly(rest.issueDate);
    } else {
      nextRunAt = undefined;
    }

    await ctx.db.patch(id, {
      ...rest,
      dueDate: rest.issueDate + rest.dueInDays * DAY,
      recurring: !!recurring,
      nextRunAt,
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

/** Create a blank draft and return its id (admin clicks "New invoice"). Optional
 *  client fields pre-fill the bill-to from a chosen saved client. */
export const createBlank = mutation({
  args: {
    adminKey: v.string(),
    clientName: v.optional(v.string()),
    clientCompany: v.optional(v.string()),
    clientEmail: v.optional(v.string()),
    clientAddress: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"invoices">> => {
    assertAdmin(args.adminKey);
    const number = await nextNumber(ctx);
    const now = Date.now();
    return ctx.db.insert("invoices", {
      number,
      clientName: args.clientName ?? "",
      clientCompany: args.clientCompany,
      clientEmail: args.clientEmail,
      clientAddress: args.clientAddress,
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

// --- Recurring (used by the cron route) ---------------------------------

/** Recurring invoices whose next run time has arrived. */
export const dueRecurring = query({
  args: { adminKey: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminKey);
    const now = Date.now();
    const all = await ctx.db.query("invoices").collect();
    return all.filter(
      (i) => i.recurring === true && typeof i.nextRunAt === "number" && i.nextRunAt <= now,
    );
  },
});

/** Generate one fresh copy of a recurring invoice and advance its schedule.
 *  Returns the new invoice id (or null if the source is no longer recurring). */
export const spawnRecurring = mutation({
  args: { adminKey: v.string(), sourceId: v.id("invoices") },
  handler: async (ctx, args): Promise<Id<"invoices"> | null> => {
    assertAdmin(args.adminKey);
    const src = await ctx.db.get(args.sourceId);
    if (!src || !src.recurring || typeof src.nextRunAt !== "number") return null;

    const issueDate = src.nextRunAt;
    const number = await nextNumber(ctx);
    const newId = await ctx.db.insert("invoices", {
      number,
      clientName: src.clientName,
      clientCompany: src.clientCompany,
      clientEmail: src.clientEmail,
      clientAddress: src.clientAddress,
      items: src.items,
      taxRate: src.taxRate,
      currency: src.currency,
      issueDate,
      dueInDays: src.dueInDays,
      dueDate: issueDate + src.dueInDays * DAY,
      notes: src.notes,
      status: "draft", // the cron emails it, then marks it "sent"
      recurring: false,
      createdAt: Date.now(),
    });

    // Advance the template to the next future monthly occurrence.
    let next = addMonths(src.nextRunAt, 1);
    const now = Date.now();
    let guard = 0;
    while (next <= now && guard < 600) {
      next = addMonths(next, 1);
      guard += 1;
    }
    await ctx.db.patch(args.sourceId, { nextRunAt: next });

    return newId;
  },
});
