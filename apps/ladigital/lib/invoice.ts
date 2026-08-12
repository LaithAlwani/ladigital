// Invoice helpers now live in @ladigital/crm. Re-exported here so existing
// `@/lib/invoice` imports keep working. Locale/currency default to CAD/en-CA
// (this site's BrandConfig); callers pass overrides where needed.
export {
  INVOICE_STATUSES,
  INVOICE_STATUS_MAP,
  invoiceTotals,
  formatMoney,
  formatDate,
} from "@ladigital/crm";
export type { InvoiceItem, InvoiceStatus } from "@ladigital/crm";
