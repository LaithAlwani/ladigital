import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { adminWriteKey } from "@/lib/admin-session";
import { CrmContacts } from "@/components/admin/crm-contacts";

export const dynamic = "force-dynamic";

export default async function CrmContactsPage() {
  const board = await fetchQuery(api.crm.board, { adminKey: adminWriteKey() }).catch(() => ({
    deals: [],
    contacts: [],
  }));
  return <CrmContacts contacts={board.contacts} deals={board.deals} />;
}
