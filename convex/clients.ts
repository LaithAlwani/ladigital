import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { assertAdmin } from "./lib/requireAdmin";

const clientFields = {
  name: v.string(),
  company: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  notes: v.optional(v.string()),
};

export const listAdmin = query({
  args: { adminKey: v.string() },
  handler: async (ctx, args) => {
    assertAdmin(args.adminKey);
    return ctx.db.query("clients").withIndex("by_created").order("desc").collect();
  },
});

export const create = mutation({
  args: { adminKey: v.string(), ...clientFields },
  handler: async (ctx, args): Promise<Id<"clients">> => {
    assertAdmin(args.adminKey);
    const { adminKey: _k, ...data } = args;
    return ctx.db.insert("clients", { ...data, createdAt: Date.now() });
  },
});

export const update = mutation({
  args: { adminKey: v.string(), id: v.id("clients"), ...clientFields },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    const { adminKey: _k, id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { adminKey: v.string(), id: v.id("clients") },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    await ctx.db.delete(args.id);
  },
});

/** Create-or-update a client (matched by email, else by exact name). Used by
 *  the invoice editor's "save to clients". Returns the client id. */
export const upsert = mutation({
  args: { adminKey: v.string(), ...clientFields },
  handler: async (ctx, args): Promise<Id<"clients">> => {
    assertAdmin(args.adminKey);
    const { adminKey: _k, ...data } = args;
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
