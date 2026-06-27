import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { adminWriteKey } from "@/lib/admin-session";
import { InvoicesAdminList } from "@/components/admin/invoices-admin-list";

export const dynamic = "force-dynamic";

export default async function InvoicesAdminPage() {
  const invoices = await fetchQuery(api.invoices.listAdmin, {
    adminKey: adminWriteKey(),
  }).catch(() => []);
  return <InvoicesAdminList initial={invoices} />;
}
