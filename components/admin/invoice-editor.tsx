"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Download, Loader2, Save, Check, Mail, UserPlus } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  INVOICE_STATUSES,
  invoiceTotals,
  formatMoney,
  type InvoiceItem,
  type InvoiceStatus,
} from "@/lib/invoice";
import { updateInvoice, sendInvoiceEmail } from "@/app/actions/admin-invoices";
import { upsertClient } from "@/app/actions/admin-clients";
import { generateInvoicePdf, invoicePdfBase64 } from "@/lib/invoice-pdf";
import { TextField, TextArea, NumberField, Toggle, Card, inputBase, labelBase } from "./admin-fields";
import { cn } from "@/lib/cn";

function toDateInput(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function fromDateInput(s: string): number {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y || 2000, (m || 1) - 1, d || 1).getTime();
}

const DAY = 86_400_000;

export function InvoiceEditor({
  invoice,
  clients,
}: {
  invoice: Doc<"invoices">;
  clients: Doc<"clients">[];
}) {
  const router = useRouter();

  const [clientName, setClientName] = React.useState(invoice.clientName);
  const [clientCompany, setClientCompany] = React.useState(invoice.clientCompany ?? "");
  const [clientEmail, setClientEmail] = React.useState(invoice.clientEmail ?? "");
  const [clientAddress, setClientAddress] = React.useState(invoice.clientAddress ?? "");
  const [items, setItems] = React.useState<InvoiceItem[]>(
    invoice.items.length ? invoice.items : [{ description: "", amount: 0 }],
  );
  const [taxRate, setTaxRate] = React.useState(invoice.taxRate);
  const [currency, setCurrency] = React.useState(invoice.currency);
  const [issueDate, setIssueDate] = React.useState(invoice.issueDate);
  const [dueInDays, setDueInDays] = React.useState(invoice.dueInDays);
  const [notes, setNotes] = React.useState(invoice.notes ?? "");
  const [status, setStatus] = React.useState<InvoiceStatus>(invoice.status as InvoiceStatus);
  const [recurring, setRecurring] = React.useState(!!invoice.recurring);

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [emailing, setEmailing] = React.useState(false);
  const [savingClient, setSavingClient] = React.useState(false);
  const [flash, setFlash] = React.useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const totals = invoiceTotals(items, taxRate);

  function pickClient(id: string) {
    const c = clients.find((x) => x._id === id);
    if (!c) return;
    setClientCompany(c.company ?? "");
    setClientName(c.name ?? "");
    setClientEmail(c.email ?? "");
    setClientAddress(c.address ?? "");
  }

  function saveToClients() {
    setSavingClient(true);
    setFlash(null);
    (async () => {
      try {
        await upsertClient({
          name: clientName,
          company: clientCompany,
          email: clientEmail,
          address: clientAddress,
        });
        router.refresh();
        setFlash({ kind: "ok", text: "Client saved to your list." });
      } catch {
        setFlash({ kind: "err", text: "Could not save the client." });
      } finally {
        setSavingClient(false);
      }
    })();
  }

  async function emailToClient() {
    if (!clientEmail.trim()) {
      setFlash({ kind: "err", text: "Add the client's email first." });
      return;
    }
    setEmailing(true);
    setFlash(null);
    try {
      await updateInvoice(invoice._id, payload());
      const base64 = await invoicePdfBase64({
        number: invoice.number,
        clientName,
        clientCompany: clientCompany || undefined,
        clientEmail: clientEmail || undefined,
        clientAddress: clientAddress || undefined,
        items: payload().items,
        taxRate: Number(taxRate) || 0,
        currency,
        issueDate,
        dueDate: issueDate + (Number(dueInDays) || 0) * DAY,
        notes: notes || undefined,
      });
      const res = await sendInvoiceEmail(invoice._id, base64);
      if (res.ok) {
        setFlash({ kind: "ok", text: `Invoice emailed to ${clientEmail}.` });
        setStatus("sent");
        router.refresh();
      } else {
        setFlash({ kind: "err", text: res.error ?? "Could not send the email." });
      }
    } catch (err) {
      console.error(err);
      setFlash({ kind: "err", text: "Could not send the email." });
    } finally {
      setEmailing(false);
    }
  }

  function setItem(i: number, patch: Partial<InvoiceItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { description: "", amount: 0 }]);
  }
  function removeItem(i: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  function payload() {
    return {
      clientName,
      clientCompany,
      clientEmail,
      clientAddress,
      items: items.map((it) => ({ description: it.description, amount: Number(it.amount) || 0 })),
      taxRate: Number(taxRate) || 0,
      currency,
      issueDate,
      dueInDays: Number(dueInDays) || 0,
      notes,
      status,
      recurring,
    };
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await updateInvoice(invoice._id, payload());
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
      alert("Could not save the invoice. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function download() {
    setDownloading(true);
    try {
      // Save first so the stored invoice matches the PDF, then export.
      await updateInvoice(invoice._id, payload());
      await generateInvoicePdf({
        number: invoice.number,
        clientName,
        clientCompany: clientCompany || undefined,
        clientEmail: clientEmail || undefined,
        clientAddress: clientAddress || undefined,
        items: payload().items,
        taxRate: Number(taxRate) || 0,
        currency,
        issueDate,
        dueDate: issueDate + (Number(dueInDays) || 0) * DAY,
        notes: notes || undefined,
      });
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Could not generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All invoices
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={emailToClient}
            disabled={emailing || saving}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange disabled:opacity-60"
          >
            {emailing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Email to client
          </button>
          <button
            type="button"
            onClick={download}
            disabled={downloading || saving}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange disabled:opacity-60"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-orange px-5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{invoice.number}</h1>
        <p className="mt-1 text-sm text-muted">
          Edit the details, then download or email the PDF, or mark it paid.
        </p>
      </div>

      {flash ? (
        <div
          className={cn(
            "rounded-card border px-4 py-2.5 text-sm",
            flash.kind === "ok"
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/30 bg-danger/10 text-danger",
          )}
        >
          {flash.text}
        </div>
      ) : null}

      <Card title="Bill to">
        {clients.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <label className={labelBase}>Use a saved client</label>
            <select
              value=""
              onChange={(e) => e.target.value && pickClient(e.target.value)}
              className={cn(inputBase, "sm:max-w-xs")}
            >
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.company || c.name}
                  {c.company && c.name ? ` — ${c.name}` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Client company" value={clientCompany} onChange={setClientCompany} />
          <TextField label="Contact name" value={clientName} onChange={setClientName} />
          <TextField label="Email" value={clientEmail} onChange={setClientEmail} type="email" />
          <TextField label="Address" value={clientAddress} onChange={setClientAddress} />
        </div>
        <button
          type="button"
          onClick={saveToClients}
          disabled={savingClient}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-brand-orange/50 hover:text-brand-orange disabled:opacity-60"
        >
          {savingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Save to clients
        </button>
      </Card>

      <Card title="Line items">
        <div className="flex flex-col gap-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                {i === 0 ? <label className={labelBase}>Description</label> : null}
                <input
                  value={it.description}
                  onChange={(e) => setItem(i, { description: e.target.value })}
                  placeholder="e.g. Website design & build"
                  className={inputBase}
                />
              </div>
              <div className="flex w-36 flex-col gap-1.5">
                {i === 0 ? <label className={labelBase}>Amount</label> : null}
                <input
                  type="number"
                  step="0.01"
                  value={Number.isFinite(it.amount) ? it.amount : ""}
                  onChange={(e) => setItem(i, { amount: e.target.value === "" ? 0 : Number(e.target.value) })}
                  className={cn(inputBase, "text-right tabular-nums")}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="mt-1 inline-flex w-fit items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-brand-orange/50 hover:text-brand-orange"
          >
            <Plus className="h-4 w-4" />
            Add line item
          </button>
        </div>

        {/* Totals preview */}
        <div className="mt-4 flex flex-col items-end gap-1.5 border-t border-border pt-4 text-sm">
          <Row label="Subtotal" value={formatMoney(totals.subtotal, currency)} />
          <Row label={`Tax (${Number(taxRate) || 0}%)`} value={formatMoney(totals.tax, currency)} />
          <div className="mt-1 flex w-56 items-center justify-between border-t border-brand-orange/40 pt-2">
            <span className="font-display text-base font-semibold text-foreground">Total Due</span>
            <span className="font-display text-base font-semibold tabular-nums text-foreground">
              {formatMoney(totals.total, currency)}
            </span>
          </div>
        </div>
      </Card>

      <Card title="Terms">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelBase}>Issue date</label>
            <input
              type="date"
              value={toDateInput(issueDate)}
              onChange={(e) => setIssueDate(fromDateInput(e.target.value))}
              className={inputBase}
            />
          </div>
          <NumberField label="Due in (days)" value={dueInDays} onChange={setDueInDays} min={0} suffix="days" />
          <NumberField label="Tax rate" value={taxRate} onChange={setTaxRate} min={0} suffix="%" />
          <div className="flex flex-col gap-1.5">
            <label className={labelBase}>Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputBase}>
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={labelBase}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
              className={inputBase}
            >
              {INVOICE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-ink/30 p-4">
          <Toggle
            label="Recurring — auto-generate &amp; email a copy every month"
            checked={recurring}
            onChange={setRecurring}
          />
          <p className="mt-2 pl-14 text-xs text-muted-2">
            A new invoice with the same line items is created one month from the issue date (and each
            month after) and automatically emailed to the client.
          </p>
        </div>
        <TextArea
          label="Notes (payment terms, thank-you, etc.)"
          value={notes}
          onChange={setNotes}
          rows={3}
          placeholder="e.g. Payment via e-transfer to info@ladigital.ca. Thank you!"
        />
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-56 items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  );
}
