"use server";

import { revalidatePath } from "next/cache";
import { fetchMutation, fetchAction } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isAdmin, adminWriteKey } from "@/lib/admin-session";
import type { ProjectStatus } from "@/lib/project-status";

// Authenticated bridge from the admin UI to Convex. Each action verifies the
// admin session cookie, then calls Convex with the shared write key. After a
// change, the public projects cache is revalidated so the live site updates
// without a redeploy.

async function ensureAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

function bustPublic() {
  // Public project pages read via uncached fetchQuery, but revalidate the
  // known paths too in case they're statically optimized.
  revalidatePath("/");
  revalidatePath("/work");
}

export async function getProjectUploadUrl(): Promise<string> {
  await ensureAdmin();
  return fetchMutation(api.projects.generateUploadUrl, { adminKey: adminWriteKey() });
}

export async function createProject(): Promise<string> {
  await ensureAdmin();
  const id = await fetchMutation(api.projects.create, { adminKey: adminWriteKey() });
  return id;
}

export async function importProjectFromUrl(
  url: string,
): Promise<{ id?: string; error?: string }> {
  await ensureAdmin();
  try {
    const res = await fetchAction(api.projects.importFromUrl, {
      adminKey: adminWriteKey(),
      url,
    });
    if (res.id) bustPublic();
    return { id: res.id, error: res.error };
  } catch (err) {
    console.error("[admin] importFromUrl failed:", err);
    return { error: "Import failed. Please try again." };
  }
}

export async function updateProject(input: {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  url?: string;
  status: ProjectStatus;
}): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.projects.update, {
    adminKey: adminWriteKey(),
    id: input.id as Id<"projects">,
    title: input.title,
    subtitle: input.subtitle || undefined,
    description: input.description,
    url: input.url || undefined,
    status: input.status,
  });
  bustPublic();
}

export async function setProjectImages(
  id: string,
  images: { storageId: string; alt?: string }[],
  coverIndex: number,
): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.projects.setImages, {
    adminKey: adminWriteKey(),
    id: id as Id<"projects">,
    images: images.map((i) => ({ storageId: i.storageId as Id<"_storage">, alt: i.alt })),
    coverIndex,
  });
  bustPublic();
}

export async function setProjectPublished(id: string, published: boolean): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.projects.setPublished, {
    adminKey: adminWriteKey(),
    id: id as Id<"projects">,
    published,
  });
  bustPublic();
}

export async function reorderProjects(ids: string[]): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.projects.reorder, {
    adminKey: adminWriteKey(),
    ids: ids.map((i) => i as Id<"projects">),
  });
  bustPublic();
}

export async function removeProject(id: string): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.projects.remove, {
    adminKey: adminWriteKey(),
    id: id as Id<"projects">,
  });
  bustPublic();
}
