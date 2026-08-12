import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { adminWriteKey } from "@/lib/admin-session";
import { InvoicesAdminList } from "@/components/admin/invoices-admin-list";

export const dynamic = "force-dynamic";

export default async function InvoicesAdminPage() {
  const key = adminWriteKey();
  const [invoices, clients] = await Promise.all([
    fetchQuery(api.invoices.listAdmin, { adminKey: key }).catch(() => []),
    fetchQuery(api.clients.listAdmin, { adminKey: key }).catch(() => []),
  ]);
  return <InvoicesAdminList initial={invoices} clients={clients} />;
}
