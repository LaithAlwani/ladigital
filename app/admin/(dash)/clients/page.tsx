import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { adminWriteKey } from "@/lib/admin-session";
import { ClientsAdmin } from "@/components/admin/clients-admin";

export const dynamic = "force-dynamic";

export default async function ClientsAdminPage() {
  const clients = await fetchQuery(api.clients.listAdmin, {
    adminKey: adminWriteKey(),
  }).catch(() => []);
  return <ClientsAdmin initial={clients} />;
}
