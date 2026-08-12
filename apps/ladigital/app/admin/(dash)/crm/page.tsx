import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { adminWriteKey } from "@/lib/admin-session";
import { CrmPipeline } from "@/components/admin/crm-pipeline";

export const dynamic = "force-dynamic";

export default async function CrmAdminPage() {
  const board = await fetchQuery(api.crm.board, { adminKey: adminWriteKey() }).catch(() => ({
    deals: [],
    contacts: [],
  }));
  return <CrmPipeline initial={board} />;
}
