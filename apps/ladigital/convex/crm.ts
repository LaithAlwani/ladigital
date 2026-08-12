import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { assertAdmin } from "./lib/requireAdmin";
import { dealStage, activityType } from "@ladigital/crm/schema";

// ----------------------------------------------------------------------------
// CRM — leads/pipeline. Contacts move into deals that flow through the stages;
// activities + tasks hang off either. A deal can be promoted to a saved client
// (and from there an invoice is created via the existing invoices flow).
// All functions are single-admin guarded (assertAdmin) like the rest of the app.
// ----------------------------------------------------------------------------

const contactFields = {
  name: v.string(),
  company: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  source: v.optional(v.string()),
  notes: v.optional(v.string()),
};

// ---- Board / reads ---------------------------------------------------------

/** Everything the pipeline board needs: all deals + all contacts. */
export const board = query({
  args: { adminKey: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminKey);
    const [deals, contacts] = await Promise.all([
      ctx.db.query("deals").withIndex("by_stage").collect(),
      ctx.db.query("contacts").withIndex("by_created").order("desc").collect(),
    ]);
    return { deals, contacts };
  },
});

export const listContacts = query({
  args: { adminKey: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminKey);
    return ctx.db.query("contacts").withIndex("by_created").order("desc").collect();
  },
});

/** A contact with its deals, activity timeline, and open tasks. */
export const contactDetail = query({
  args: { adminKey: v.string(), id: v.id("contacts") },
  handler: async (ctx, args) => {
    assertAdmin(args.adminKey);
    const contact = await ctx.db.get(args.id);
    if (!contact) return null;
    const [deals, activities, tasks] = await Promise.all([
      ctx.db.query("deals").withIndex("by_contact", (q) => q.eq("contactId", args.id)).collect(),
      ctx.db
        .query("activities")
        .withIndex("by_contact", (q) => q.eq("contactId", args.id))
        .order("desc")
        .collect(),
      ctx.db.query("tasks").withIndex("by_contact", (q) => q.eq("contactId", args.id)).collect(),
    ]);
    return { contact, deals, activities, tasks };
  },
});

/** A deal with its contact, activity timeline, and tasks. */
export const dealDetail = query({
  args: { adminKey: v.string(), id: v.id("deals") },
  handler: async (ctx, args) => {
    assertAdmin(args.adminKey);
    const deal = await ctx.db.get(args.id);
    if (!deal) return null;
    const contact = deal.contactId ? await ctx.db.get(deal.contactId) : null;
    const [activities, tasks] = await Promise.all([
      ctx.db.query("activities").withIndex("by_deal", (q) => q.eq("dealId", args.id)).order("desc").collect(),
      ctx.db.query("tasks").withIndex("by_deal", (q) => q.eq("dealId", args.id)).collect(),
    ]);
    return { deal, contact, activities, tasks };
  },
});

// ---- Contacts --------------------------------------------------------------

export const createContact = mutation({
  args: { adminKey: v.string(), ...contactFields },
  handler: async (ctx, args): Promise<Id<"contacts">> => {
    assertAdmin(args.adminKey);
    const { adminKey: _k, ...data } = args;
    return ctx.db.insert("contacts", { ...data, createdAt: Date.now() });
  },
});

export const updateContact = mutation({
  args: { adminKey: v.string(), id: v.id("contacts"), ...contactFields },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    const { adminKey: _k, id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const removeContact = mutation({
  args: { adminKey: v.string(), id: v.id("contacts") },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    // Detach the contact from its deals; keep the deals in the pipeline.
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_contact", (q) => q.eq("contactId", args.id))
      .collect();
    for (const d of deals) await ctx.db.patch(d._id, { contactId: undefined });
    await ctx.db.delete(args.id);
  },
});

// ---- Deals -----------------------------------------------------------------

export const createDeal = mutation({
  args: {
    adminKey: v.string(),
    title: v.string(),
    contactId: v.optional(v.id("contacts")),
    value: v.optional(v.number()),
    stage: v.optional(dealStage),
  },
  handler: async (ctx, args): Promise<Id<"deals">> => {
    assertAdmin(args.adminKey);
    return ctx.db.insert("deals", {
      title: args.title,
      contactId: args.contactId,
      value: args.value,
      stage: args.stage ?? "new",
      order: Date.now(), // append to the bottom of its column
      createdAt: Date.now(),
    });
  },
});

export const updateDeal = mutation({
  args: {
    adminKey: v.string(),
    id: v.id("deals"),
    title: v.optional(v.string()),
    contactId: v.optional(v.id("contacts")),
    value: v.optional(v.number()),
    closeDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    const { adminKey: _k, id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

/** Move a deal to a different stage (append to the bottom of that column). */
export const moveDeal = mutation({
  args: { adminKey: v.string(), id: v.id("deals"), stage: dealStage },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    const deal = await ctx.db.get(args.id);
    if (!deal || deal.stage === args.stage) {
      if (deal) await ctx.db.patch(args.id, { stage: args.stage });
      return;
    }
    await ctx.db.patch(args.id, { stage: args.stage, order: Date.now() });
    // Log the stage change on the deal's timeline.
    await ctx.db.insert("activities", {
      dealId: args.id,
      contactId: deal.contactId,
      type: "stage-change",
      body: `Moved from ${deal.stage} to ${args.stage}`,
      createdAt: Date.now(),
    });
  },
});

export const removeDeal = mutation({
  args: { adminKey: v.string(), id: v.id("deals") },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    const [activities, tasks] = await Promise.all([
      ctx.db.query("activities").withIndex("by_deal", (q) => q.eq("dealId", args.id)).collect(),
      ctx.db.query("tasks").withIndex("by_deal", (q) => q.eq("dealId", args.id)).collect(),
    ]);
    for (const a of activities) await ctx.db.delete(a._id);
    for (const t of tasks) await ctx.db.delete(t._id);
    await ctx.db.delete(args.id);
  },
});

// ---- Activities ------------------------------------------------------------

export const addActivity = mutation({
  args: {
    adminKey: v.string(),
    contactId: v.optional(v.id("contacts")),
    dealId: v.optional(v.id("deals")),
    type: activityType,
    body: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"activities">> => {
    assertAdmin(args.adminKey);
    const { adminKey: _k, ...data } = args;
    return ctx.db.insert("activities", { ...data, createdAt: Date.now() });
  },
});

// ---- Tasks -----------------------------------------------------------------

export const listOpenTasks = query({
  args: { adminKey: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminKey);
    const tasks = await ctx.db.query("tasks").withIndex("by_due").collect();
    return tasks.filter((t) => !t.done).sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity));
  },
});

export const addTask = mutation({
  args: {
    adminKey: v.string(),
    title: v.string(),
    contactId: v.optional(v.id("contacts")),
    dealId: v.optional(v.id("deals")),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Id<"tasks">> => {
    assertAdmin(args.adminKey);
    const { adminKey: _k, ...data } = args;
    return ctx.db.insert("tasks", { ...data, done: false, createdAt: Date.now() });
  },
});

export const toggleTask = mutation({
  args: { adminKey: v.string(), id: v.id("tasks"), done: v.boolean() },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    await ctx.db.patch(args.id, { done: args.done });
  },
});

export const removeTask = mutation({
  args: { adminKey: v.string(), id: v.id("tasks") },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    await ctx.db.delete(args.id);
  },
});

// ---- Promote ---------------------------------------------------------------

/** Promote a contact to a saved client (create-or-update, matched by email
 *  then name). Returns the client id so the caller can jump to a new invoice. */
export const promoteContactToClient = mutation({
  args: { adminKey: v.string(), contactId: v.id("contacts") },
  handler: async (ctx, args): Promise<Id<"clients">> => {
    assertAdmin(args.adminKey);
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");
    const data = {
      name: contact.name,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      notes: contact.notes,
    };
    const all = await ctx.db.query("clients").collect();
    const match = all.find(
      (c) =>
        (data.email && c.email && c.email.toLowerCase() === data.email.toLowerCase()) ||
        (!data.email && c.name.toLowerCase() === data.name.toLowerCase()),
    );
    if (match) {
      await ctx.db.patch(match._id, data);
      return match._id;
    }
    return ctx.db.insert("clients", { ...data, createdAt: Date.now() });
  },
});
