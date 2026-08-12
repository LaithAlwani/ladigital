import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { ContentEditor } from "@/components/admin/content-editor";

export const dynamic = "force-dynamic";

export default async function ContentAdminPage() {
  const settings = await fetchQuery(api.settings.getPublic, {}).catch(() => null);
  return <ContentEditor settings={settings} />;
}
