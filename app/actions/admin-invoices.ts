"use server";

import { render } from "@react-email/components";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isAdmin, adminWriteKey } from "@/lib/admin-session";
import { sendMail } from "@/lib/mailer";
import { siteConfig } from "@/lib/site-config";
import { invoiceTotals, formatMoney, formatDate, type InvoiceItem, type InvoiceStatus } from "@/lib/invoice";
import InvoiceEmail from "@/emails/invoice-email";

async function ensureAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

export async function createBlankInvoice(client?: {
  name?: string;
  company?: string;
  email?: string;
  address?: string;
}): Promise<string> {
  await ensureAdmin();
  return fetchMutation(api.invoices.createBlank, {
    adminKey: adminWriteKey(),
    clientName: client?.name || undefined,
    clientCompany: client?.company || undefined,
    clientEmail: client?.email || undefined,
    clientAddress: client?.address || undefined,
  });
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
  recurring?: boolean;
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
    recurring: !!data.recurring,
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

/** Email the invoice PDF (generated client-side, passed as base64) to the client. */
export async function sendInvoiceEmail(
  id: string,
  pdfBase64: string,
): Promise<{ ok: boolean; error?: string }> {
  await ensureAdmin();
  const inv = await fetchQuery(api.invoices.getAdmin, {
    adminKey: adminWriteKey(),
    id: id as Id<"invoices">,
  });
  if (!inv) return { ok: false, error: "Invoice not found." };
  if (!inv.clientEmail) return { ok: false, error: "Add the client's email first." };

  const { total } = invoiceTotals(inv.items, inv.taxRate);
  let html: string;
  try {
    html = await render(
      InvoiceEmail({
        clientName: inv.clientName || inv.clientCompany || "there",
        number: inv.number,
        totalText: formatMoney(total, inv.currency),
        dueText: formatDate(inv.dueDate),
        notes: inv.notes,
      }),
    );
  } catch (err) {
    console.error("[invoice] email render failed", err);
    return { ok: false, error: "Could not prepare the email." };
  }

  const result = await sendMail({
    to: inv.clientEmail,
    replyTo: siteConfig.contact.email,
    subject: `Invoice ${inv.number} from ${siteConfig.company.name}`,
    html,
    attachments: [{ filename: `${inv.number}.pdf`, content: pdfBase64, contentType: "application/pdf" }],
  });
  if (!result.ok) {
    return { ok: false, error: result.error ?? "Email failed to send." };
  }
  if (result.skipped) {
    return { ok: false, error: "Email isn't configured on the server (SMTP)." };
  }

  // Mark as sent once it's emailed.
  await fetchMutation(api.invoices.setStatus, {
    adminKey: adminWriteKey(),
    id: id as Id<"invoices">,
    status: "sent",
  });
  return { ok: true };
}
