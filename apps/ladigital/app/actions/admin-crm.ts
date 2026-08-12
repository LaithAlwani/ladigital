"use server";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isAdmin, adminWriteKey } from "@/lib/admin-session";
import type { DealStage } from "@ladigital/crm";

async function ensureAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}
const key = () => adminWriteKey();

// ---- Contacts --------------------------------------------------------------

export type ContactPayload = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  notes?: string;
};

function cleanContact(d: ContactPayload) {
  return {
    name: d.name,
    company: d.company?.trim() || undefined,
    email: d.email?.trim() || undefined,
    phone: d.phone?.trim() || undefined,
    source: d.source?.trim() || undefined,
    notes: d.notes?.trim() || undefined,
  };
}

export async function createContact(data: ContactPayload): Promise<string> {
  await ensureAdmin();
  return fetchMutation(api.crm.createContact, { adminKey: key(), ...cleanContact(data) });
}

export async function updateContact(id: string, data: ContactPayload): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.crm.updateContact, {
    adminKey: key(),
    id: id as Id<"contacts">,
    ...cleanContact(data),
  });
}

export async function removeContact(id: string): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.crm.removeContact, { adminKey: key(), id: id as Id<"contacts"> });
}

// ---- Deals -----------------------------------------------------------------

export async function createDeal(input: {
  title: string;
  contactId?: string;
  value?: number;
  stage?: DealStage;
}): Promise<string> {
  await ensureAdmin();
  return fetchMutation(api.crm.createDeal, {
    adminKey: key(),
    title: input.title,
    contactId: input.contactId ? (input.contactId as Id<"contacts">) : undefined,
    value: input.value,
    stage: input.stage,
  });
}

export async function updateDeal(
  id: string,
  data: { title?: string; value?: number; closeDate?: number; notes?: string; contactId?: string },
): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.crm.updateDeal, {
    adminKey: key(),
    id: id as Id<"deals">,
    title: data.title,
    value: data.value,
    closeDate: data.closeDate,
    notes: data.notes,
    contactId: data.contactId ? (data.contactId as Id<"contacts">) : undefined,
  });
}

export async function moveDeal(id: string, stage: DealStage): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.crm.moveDeal, { adminKey: key(), id: id as Id<"deals">, stage });
}

export async function removeDeal(id: string): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.crm.removeDeal, { adminKey: key(), id: id as Id<"deals"> });
}

export async function getDealDetail(id: string) {
  await ensureAdmin();
  return fetchQuery(api.crm.dealDetail, { adminKey: key(), id: id as Id<"deals"> });
}

// ---- Activities + tasks ----------------------------------------------------

export async function addActivity(input: {
  contactId?: string;
  dealId?: string;
  type: "note" | "call" | "email" | "meeting" | "stage-change";
  body: string;
}): Promise<string> {
  await ensureAdmin();
  return fetchMutation(api.crm.addActivity, {
    adminKey: key(),
    contactId: input.contactId ? (input.contactId as Id<"contacts">) : undefined,
    dealId: input.dealId ? (input.dealId as Id<"deals">) : undefined,
    type: input.type,
    body: input.body,
  });
}

export async function addTask(input: {
  title: string;
  contactId?: string;
  dealId?: string;
  dueAt?: number;
}): Promise<string> {
  await ensureAdmin();
  return fetchMutation(api.crm.addTask, {
    adminKey: key(),
    title: input.title,
    contactId: input.contactId ? (input.contactId as Id<"contacts">) : undefined,
    dealId: input.dealId ? (input.dealId as Id<"deals">) : undefined,
    dueAt: input.dueAt,
  });
}

export async function toggleTask(id: string, done: boolean): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.crm.toggleTask, { adminKey: key(), id: id as Id<"tasks">, done });
}

export async function removeTask(id: string): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.crm.removeTask, { adminKey: key(), id: id as Id<"tasks"> });
}

// ---- Promote ---------------------------------------------------------------

/** Promote a contact to a saved client, then create a blank draft invoice
 *  pre-filled with the client's bill-to. Returns the new invoice id so the UI
 *  can jump straight into the invoice editor. */
export async function promoteContactToInvoice(contactId: string): Promise<string> {
  await ensureAdmin();
  const clientId = await fetchMutation(api.crm.promoteContactToClient, {
    adminKey: key(),
    contactId: contactId as Id<"contacts">,
  });
  const client = await fetchQuery(api.clients.listAdmin, { adminKey: key() }).then((cs) =>
    cs.find((c) => c._id === clientId),
  );
  return fetchMutation(api.invoices.createBlank, {
    adminKey: key(),
    clientName: client?.name,
    clientCompany: client?.company,
    clientEmail: client?.email,
    clientAddress: client?.address,
  });
}

/** Promote a contact to a saved client only (no invoice). Returns client id. */
export async function promoteContactToClient(contactId: string): Promise<string> {
  await ensureAdmin();
  return fetchMutation(api.crm.promoteContactToClient, {
    adminKey: key(),
    contactId: contactId as Id<"contacts">,
  });
}
