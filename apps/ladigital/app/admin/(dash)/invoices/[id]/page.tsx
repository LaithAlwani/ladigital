import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { adminWriteKey } from "@/lib/admin-session";
import { InvoiceEditor } from "@/components/admin/invoice-editor";

export const dynamic = "force-dynamic";

export default async function InvoiceEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const key = adminWriteKey();
  const [invoice, clients] = await Promise.all([
    fetchQuery(api.invoices.getAdmin, { adminKey: key, id: id as Id<"invoices"> }).catch(() => null),
    fetchQuery(api.clients.listAdmin, { adminKey: key }).catch(() => []),
  ]);
  if (!invoice) notFound();
  return <InvoiceEditor invoice={invoice} clients={clients} />;
}
