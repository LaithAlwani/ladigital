import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { adminWriteKey } from "@/lib/admin-session";
import { ProjectEditor } from "@/components/admin/project-editor";

export const dynamic = "force-dynamic";

export default async function ProjectEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await fetchQuery(api.projects.getByIdAdmin, {
    adminKey: adminWriteKey(),
    id: id as Id<"projects">,
  }).catch(() => null);

  if (!project) notFound();

  return <ProjectEditor project={project} />;
}
