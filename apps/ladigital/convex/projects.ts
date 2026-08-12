import { v, ConvexError } from "convex/values";
import {
  mutation,
  query,
  action,
  internalMutation,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
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

// ---- Create with full data (used by URL import + the screenshot script) ----

type NewProject = {
  title: string;
  subtitle?: string;
  description: string;
  url?: string;
  status: Doc<"projects">["status"];
  images: { storageId: Id<"_storage">; alt?: string }[];
  published?: boolean;
};

async function insertProjectDoc(ctx: MutationCtx, data: NewProject): Promise<Id<"projects">> {
  const all = await ctx.db.query("projects").withIndex("by_order").collect();
  const maxOrder = all.reduce((m, p) => Math.max(m, p.order), -1);
  const slug = await uniqueSlug(ctx, slugify(data.title || "project"));
  return ctx.db.insert("projects", {
    title: data.title || "Untitled project",
    subtitle: data.subtitle,
    description: data.description,
    images: data.images,
    coverIndex: 0,
    slug,
    url: data.url,
    status: data.status,
    order: maxOrder + 1,
    published: data.published ?? false,
    createdAt: Date.now(),
  });
}

const fullArgs = {
  title: v.string(),
  subtitle: v.optional(v.string()),
  description: v.string(),
  url: v.optional(v.string()),
  status: projectStatus,
  images: v.array(v.object({ storageId: v.id("_storage"), alt: v.optional(v.string()) })),
  published: v.optional(v.boolean()),
};

/** Public — create a fully-specified project (used by the screenshot import script). */
export const createFull = mutation({
  args: { adminKey: v.string(), ...fullArgs },
  handler: async (ctx, args): Promise<Id<"projects">> => {
    assertAdmin(args.adminKey);
    const { adminKey: _k, ...data } = args;
    return insertProjectDoc(ctx, data);
  },
});

/** Internal — insert used by the importFromUrl action (already admin-checked). */
export const insertProject = internalMutation({
  args: fullArgs,
  handler: async (ctx, args): Promise<Id<"projects">> => insertProjectDoc(ctx, args),
});

// ---- Import a project from a public URL (og:image + metadata) ----------

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function attr(tag: string, name: string): string | null {
  const dq = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i"));
  if (dq) return dq[1];
  const sq = tag.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, "i"));
  return sq ? sq[1] : null;
}

function parseMeta(html: string): { title: string | null; description: string; image: string | null } {
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  let image: string | null = null;
  let ogTitle: string | null = null;
  let ogDesc: string | null = null;
  let metaDesc: string | null = null;
  for (const tag of metas) {
    const key = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
    const content = attr(tag, "content");
    if (!content) continue;
    if ((key === "og:image" || key === "og:image:url") && !image) image = content;
    else if (key === "twitter:image" && !image) image = content;
    else if (key === "og:title" && !ogTitle) ogTitle = content;
    else if (key === "og:description" && !ogDesc) ogDesc = content;
    else if (key === "description" && !metaDesc) metaDesc = content;
  }
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = ogTitle ?? (titleTag ? titleTag[1].trim() : null);
  return {
    title: title ? decodeEntities(title).slice(0, 80) : null,
    description: decodeEntities(ogDesc ?? metaDesc ?? ""),
    image: image ?? null,
  };
}

export const importFromUrl = action({
  args: { adminKey: v.string(), url: v.string() },
  handler: async (ctx, args): Promise<{ id?: Id<"projects">; error?: string }> => {
    assertAdmin(args.adminKey);

    let pageUrl = args.url.trim();
    if (!/^https?:\/\//i.test(pageUrl)) pageUrl = `https://${pageUrl}`;
    try {
      // eslint-disable-next-line no-new
      new URL(pageUrl);
    } catch {
      return { error: "That doesn't look like a valid URL." };
    }

    let html: string;
    try {
      const res = await fetch(pageUrl, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; LADigitalBot/1.0)" },
        redirect: "follow",
      });
      if (!res.ok) return { error: `The site responded with ${res.status}.` };
      html = await res.text();
    } catch {
      return { error: "Couldn't reach that URL." };
    }

    const meta = parseMeta(html);

    const images: { storageId: Id<"_storage">; alt?: string }[] = [];
    if (meta.image) {
      try {
        const imgUrl = new URL(meta.image, pageUrl).toString();
        const imgRes = await fetch(imgUrl);
        const type = imgRes.headers.get("content-type") ?? "";
        if (imgRes.ok && type.startsWith("image/")) {
          const blob = await imgRes.blob();
          const storageId = await ctx.storage.store(blob);
          images.push({ storageId, alt: meta.title ?? "" });
        }
      } catch {
        // Non-fatal — create the project without an image; owner can upload one.
      }
    }

    const host = new URL(pageUrl).hostname.replace(/^www\./, "");
    const id: Id<"projects"> = await ctx.runMutation(internal.projects.insertProject, {
      title: meta.title || host,
      description: meta.description,
      url: pageUrl,
      status: "live",
      images,
      published: false,
    });
    return { id };
  },
});
