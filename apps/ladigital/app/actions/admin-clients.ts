"use server";

import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isAdmin, adminWriteKey } from "@/lib/admin-session";

async function ensureAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

export type ClientPayload = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
};

function clean(data: ClientPayload) {
  return {
    name: data.name,
    company: data.company?.trim() || undefined,
    email: data.email?.trim() || undefined,
    phone: data.phone?.trim() || undefined,
    address: data.address?.trim() || undefined,
    notes: data.notes?.trim() || undefined,
  };
}

export async function createClient(data: ClientPayload): Promise<string> {
  await ensureAdmin();
  return fetchMutation(api.clients.create, { adminKey: adminWriteKey(), ...clean(data) });
}

export async function updateClient(id: string, data: ClientPayload): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.clients.update, {
    adminKey: adminWriteKey(),
    id: id as Id<"clients">,
    ...clean(data),
  });
}

export async function removeClient(id: string): Promise<void> {
  await ensureAdmin();
  await fetchMutation(api.clients.remove, { adminKey: adminWriteKey(), id: id as Id<"clients"> });
}

/** Create-or-update a client (matched by email/name) — used by "save to clients". */
export async function upsertClient(data: ClientPayload): Promise<string> {
  await ensureAdmin();
  return fetchMutation(api.clients.upsert, { adminKey: adminWriteKey(), ...clean(data) });
}
