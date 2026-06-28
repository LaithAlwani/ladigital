"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, Download, Loader2, FileText } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  INVOICE_STATUSES,
  INVOICE_STATUS_MAP,
  invoiceTotals,
  formatMoney,
  formatDate,
  type InvoiceStatus,
} from "@/lib/invoice";
import {
  createBlankInvoice,
  setInvoiceStatus,
  removeInvoice,
} from "@/app/actions/admin-invoices";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import { cn } from "@/lib/cn";
import { useConfirm } from "./confirm-dialog";

type Invoice = Doc<"invoices">;
type Client = Doc<"clients">;

export function InvoicesAdminList({
  initial,
  clients,
}: {
  initial: Invoice[];
  clients: Client[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = React.useTransition();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [newClientId, setNewClientId] = React.useState("");

  function newInvoice() {
    const client = clients.find((c) => c._id === newClientId);
    startTransition(async () => {
      const id = await createBlankInvoice(
        client
          ? {
              name: client.name,
              company: client.company,
              email: client.email,
              address: client.address,
            }
          : undefined,
      );
      router.push(`/admin/invoices/${id}`);
    });
  }

  function changeStatus(inv: Invoice, status: InvoiceStatus) {
    setBusyId(inv._id);
    startTransition(async () => {
      await setInvoiceStatus(inv._id, status);
      setBusyId(null);
      router.refresh();
    });
  }

  async function remove(inv: Invoice) {
    const ok = await confirm({
      title: "Delete invoice",
      message: `Delete invoice ${inv.number}? This can't be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusyId(inv._id);
    startTransition(async () => {
      await removeInvoice(inv._id);
      setBusyId(null);
      router.refresh();
    });
  }

  async function downloadPdf(inv: Invoice) {
    await generateInvoicePdf({
      number: inv.number,
      clientName: inv.clientName,
      clientCompany: inv.clientCompany,
      clientEmail: inv.clientEmail,
      clientAddress: inv.clientAddress,
      items: inv.items,
      taxRate: inv.taxRate,
      currency: inv.currency,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      notes: inv.notes,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Invoices</h1>
          <p className="mt-1 text-sm text-muted">Create, track, and export client invoices.</p>
        </div>
        <div className="flex items-center gap-2">
          {clients.length > 0 ? (
            <select
              value={newClientId}
              onChange={(e) => setNewClientId(e.target.value)}
              title="Pre-fill from a client"
              className="h-11 rounded-lg border border-border bg-ink/40 px-3 text-sm text-foreground focus:border-brand-orange focus:outline-none"
            >
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.company || c.name}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            onClick={newInvoice}
            disabled={pending}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-orange px-5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            New invoice
          </button>
        </div>
      </div>

      {initial.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface/30 p-10 text-center">
          <FileText className="h-7 w-7 text-muted-2" />
          <p className="text-sm text-muted">No invoices yet. Create your first one.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface/40">
          <div className="hidden grid-cols-[1fr_1.4fr_0.8fr_1fr_auto] gap-4 border-b border-border px-5 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-2 md:grid">
            <span>Invoice</span>
            <span>Client</span>
            <span className="text-right">Total</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-border">
            {initial.map((inv) => {
              const { total } = invoiceTotals(inv.items, inv.taxRate);
              const busy = busyId === inv._id;
              const status = INVOICE_STATUS_MAP[inv.status as InvoiceStatus];
              return (
                <div
                  key={inv._id}
                  className="grid grid-cols-1 items-center gap-3 px-5 py-3.5 md:grid-cols-[1fr_1.4fr_0.8fr_1fr_auto] md:gap-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{inv.number}</p>
                    <p className="text-xs text-muted-2">Due {formatDate(inv.dueDate)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">
                      {inv.clientCompany || inv.clientName || "—"}
                    </p>
                    {inv.clientCompany && inv.clientName ? (
                      <p className="truncate text-xs text-muted-2">{inv.clientName}</p>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium tabular-nums text-foreground md:text-right">
                    {formatMoney(total, inv.currency)}
                  </p>
                  <div>
                    <select
                      value={inv.status}
                      disabled={busy}
                      onChange={(e) => changeStatus(inv, e.target.value as InvoiceStatus)}
                      className={cn(
                        "rounded-pill border px-2.5 py-1 text-xs font-medium focus:outline-none",
                        status?.badge,
                      )}
                    >
                      {INVOICE_STATUSES.map((s) => (
                        <option key={s.value} value={s.value} className="bg-ink text-foreground">
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1 md:justify-end">
                    <button
                      type="button"
                      onClick={() => downloadPdf(inv)}
                      title="Download PDF"
                      className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-brand-orange"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/admin/invoices/${inv._id}`}
                      title="Edit"
                      className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(inv)}
                      disabled={busy}
                      title="Delete"
                      className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
