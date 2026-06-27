export type InvoiceItem = { description: string; amount: number };
export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled";

export const INVOICE_STATUSES: {
  value: InvoiceStatus;
  label: string;
  badge: string;
}[] = [
  { value: "draft", label: "Draft", badge: "border-border bg-ink/40 text-muted-2" },
  { value: "sent", label: "Sent", badge: "border-brand-orange/30 bg-brand-orange/10 text-brand-orange" },
  { value: "paid", label: "Paid", badge: "border-success/30 bg-success/10 text-success" },
  { value: "cancelled", label: "Cancelled", badge: "border-danger/30 bg-danger/10 text-danger" },
];

export const INVOICE_STATUS_MAP = Object.fromEntries(
  INVOICE_STATUSES.map((s) => [s.value, s]),
) as Record<InvoiceStatus, (typeof INVOICE_STATUSES)[number]>;

export function invoiceTotals(items: InvoiceItem[], taxRate: number) {
  const subtotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const tax = subtotal * ((Number(taxRate) || 0) / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

export function formatMoney(n: number, currency = "CAD"): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatDate(epochMs: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(epochMs));
}
