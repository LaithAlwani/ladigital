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

export function formatMoney(n: number, currency = "CAD", locale = "en-CA"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatDate(epochMs: number, locale = "en-CA"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(epochMs));
}

// ---- Pure invoice scheduling math (recurring) -----------------------------

/** Add `n` calendar months to an epoch, clamping to the last day on overflow. */
export function addMonths(epoch: number, n: number): number {
  const d = new Date(epoch);
  const day = d.getDate();
  d.setMonth(d.getMonth() + n);
  if (d.getDate() < day) d.setDate(0); // e.g. Jan 31 + 1mo -> Feb 28
  return d.getTime();
}

/** First monthly occurrence strictly in the future, starting one month after issue. */
export function firstFutureMonthly(issueEpoch: number, now: number): number {
  let t = addMonths(issueEpoch, 1);
  let guard = 0;
  while (t <= now && guard < 600) {
    t = addMonths(t, 1);
    guard += 1;
  }
  return t;
}

/** Next monthly occurrence strictly after `now`, advancing from `from`. */
export function nextMonthlyAfter(from: number, now: number): number {
  let next = addMonths(from, 1);
  let guard = 0;
  while (next <= now && guard < 600) {
    next = addMonths(next, 1);
    guard += 1;
  }
  return next;
}

/** Next invoice number given existing numbers, e.g. "INV-1001" → "INV-1002". */
export function nextInvoiceNumber(existing: string[], prefix = "INV-", start = 1000): string {
  let max = start;
  for (const num of existing) {
    const m = num.match(/(\d+)\s*$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}${max + 1}`;
}
