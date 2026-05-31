import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { adminWriteKey } from "@/lib/admin-session";
import { ProjectsAdminList } from "@/components/admin/projects-admin-list";

export const dynamic = "force-dynamic";

export default async function ProjectsAdminPage() {
  const projects = await fetchQuery(api.projects.listAllAdmin, {
    adminKey: adminWriteKey(),
  }).catch(() => []);
  return <ProjectsAdminList initial={projects} />;
}
