"use server";

import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isAdmin, adminWriteKey } from "@/lib/admin-session";
import type { InvoiceItem, InvoiceStatus } from "@/lib/invoice";

async function ensureAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

export async function createBlankInvoice(): Promise<string> {
  await ensureAdmin();
  return fetchMutation(api.invoices.createBlank, { adminKey: adminWriteKey() });
}

export type InvoicePayload = {
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  clientAddress?: string;
  items: InvoiceItem[];
  taxRate: number;
  currency: string;
  issueDate: number;
  dueInDays: number;
  notes?: string;
  status: InvoiceStatus;
};

export async function updateInvoice(id: string, data: InvoicePayload): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.invoices.update, {
    adminKey: adminWriteKey(),
    id: id as Id<"invoices">,
    clientName: data.clientName,
    clientCompany: data.clientCompany || undefined,
    clientEmail: data.clientEmail || undefined,
    clientAddress: data.clientAddress || undefined,
    items: data.items,
    taxRate: data.taxRate,
    currency: data.currency,
    issueDate: data.issueDate,
    dueInDays: data.dueInDays,
    notes: data.notes || undefined,
    status: data.status,
  });
}

export async function setInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.invoices.setStatus, {
    adminKey: adminWriteKey(),
    id: id as Id<"invoices">,
    status,
  });
}

export async function removeInvoice(id: string): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.invoices.remove, {
    adminKey: adminWriteKey(),
    id: id as Id<"invoices">,
  });
}
