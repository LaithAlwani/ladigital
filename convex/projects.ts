import { v, ConvexError } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { projectStatus } from "./schema";
import { assertAdmin } from "./lib/requireAdmin";

// ----------------------------------------------------------------------------
// Projects / portfolio. Public queries return only published projects with
// resolved image URLs. Admin mutations + admin reads are guarded by the shared
// ADMIN_WRITE_KEY (injected by the authenticated Next server actions).
// ----------------------------------------------------------------------------

export type ResolvedImage = { storageId: Id<"_storage">; alt?: string; url: string | null };
export type ResolvedProject = {
  _id: Id<"projects">;
  title: string;
  subtitle?: string;
  description: string;
  images: ResolvedImage[];
  coverIndex: number;
  coverUrl: string | null;
  slug: string;
  url?: string;
  status: Doc<"projects">["status"];
  order: number;
  published: boolean;
  createdAt: number;
};

async function resolve(ctx: QueryCtx, doc: Doc<"projects">): Promise<ResolvedProject> {
  const images = await Promise.all(
    doc.images.map(async (img) => ({
      storageId: img.storageId,
      alt: img.alt,
      url: await ctx.storage.getUrl(img.storageId),
    })),
  );
  const cover = images[doc.coverIndex] ?? images[0];
  return {
    _id: doc._id,
    title: doc.title,
    subtitle: doc.subtitle,
    description: doc.description,
    images,
    coverIndex: doc.coverIndex,
    coverUrl: cover?.url ?? null,
    slug: doc.slug,
    url: doc.url,
    status: doc.status,
    order: doc.order,
    published: doc.published,
    createdAt: doc.createdAt,
  };
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "project"
  );
}

async function uniqueSlug(ctx: QueryCtx, base: string, excludeId?: Id<"projects">): Promise<string> {
  let slug = base;
  let n = 1;
  // Bounded: in practice resolves in 1–2 iterations.
  for (let i = 0; i < 1000; i++) {
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!existing || existing._id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

// ---- Public reads -------------------------------------------------------

export const listPublished = query({
  args: {},
  handler: async (ctx): Promise<ResolvedProject[]> => {
    const docs = await ctx.db.query("projects").withIndex("by_order").collect();
    const published = docs.filter((d) => d.published);
    return Promise.all(published.map((d) => resolve(ctx, d)));
  },
});

export const getPublishedBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args): Promise<ResolvedProject | null> => {
    const doc = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!doc || !doc.published) return null;
    return resolve(ctx, doc);
  },
});

// ---- Admin reads (key-guarded) -----------------------------------------

export const listAllAdmin = query({
  args: { adminKey: v.string() },
  handler: async (ctx, args): Promise<ResolvedProject[]> => {
    assertAdmin(args.adminKey);
    const docs = await ctx.db.query("projects").withIndex("by_order").collect();
    return Promise.all(docs.map((d) => resolve(ctx, d)));
  },
});

export const getByIdAdmin = query({
  args: { adminKey: v.string(), id: v.id("projects") },
  handler: async (ctx, args): Promise<ResolvedProject | null> => {
    assertAdmin(args.adminKey);
    const doc = await ctx.db.get(args.id);
    return doc ? resolve(ctx, doc) : null;
  },
});

// ---- Admin writes (key-guarded) ----------------------------------------

export const generateUploadUrl = mutation({
  args: { adminKey: v.string() },
  handler: async (ctx, args): Promise<string> => {
    assertAdmin(args.adminKey);
    return ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: { adminKey: v.string() },
  handler: async (ctx, args): Promise<Id<"projects">> => {
    assertAdmin(args.adminKey);
    const all = await ctx.db.query("projects").withIndex("by_order").collect();
    const maxOrder = all.reduce((m, p) => Math.max(m, p.order), -1);
    const slug = await uniqueSlug(ctx, "untitled-project");
    return ctx.db.insert("projects", {
      title: "Untitled project",
      description: "",
      images: [],
      coverIndex: 0,
      slug,
      status: "under-construction",
      order: maxOrder + 1,
      published: false,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    adminKey: v.string(),
    id: v.id("projects"),
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.string(),
    url: v.optional(v.string()),
    status: projectStatus,
  },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new ConvexError("Project not found.");
    const slug = await uniqueSlug(ctx, slugify(args.title), args.id);
    await ctx.db.patch(args.id, {
      title: args.title,
      subtitle: args.subtitle,
      description: args.description,
      url: args.url,
      status: args.status,
      slug,
    });
  },
});

export const setImages = mutation({
  args: {
    adminKey: v.string(),
    id: v.id("projects"),
    images: v.array(v.object({ storageId: v.id("_storage"), alt: v.optional(v.string()) })),
    coverIndex: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new ConvexError("Project not found.");
    // Delete any storage objects no longer referenced.
    const keep = new Set(args.images.map((i) => i.storageId));
    for (const old of doc.images) {
      if (!keep.has(old.storageId)) await ctx.storage.delete(old.storageId);
    }
    const coverIndex = Math.max(0, Math.min(args.coverIndex, Math.max(0, args.images.length - 1)));
    await ctx.db.patch(args.id, { images: args.images, coverIndex });
  },
});

export const setPublished = mutation({
  args: { adminKey: v.string(), id: v.id("projects"), published: v.boolean() },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    await ctx.db.patch(args.id, { published: args.published });
  },
});

export const reorder = mutation({
  args: { adminKey: v.string(), ids: v.array(v.id("projects")) },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    for (let i = 0; i < args.ids.length; i += 1) {
      await ctx.db.patch(args.ids[i], { order: i });
    }
  },
});

export const remove = mutation({
  args: { adminKey: v.string(), id: v.id("projects") },
  handler: async (ctx, args): Promise<void> => {
    assertAdmin(args.adminKey);
    const doc = await ctx.db.get(args.id);
    if (!doc) return;
    for (const img of doc.images) await ctx.storage.delete(img.storageId);
    await ctx.db.delete(args.id);
  },
});
