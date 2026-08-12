// @ladigital/crm — reusable CRM: clients + invoices and a leads/pipeline
// (contacts → deals → activities → tasks). Schema fragments the app spreads into
// its Convex deployment, plus pure pipeline/invoice logic. UI stays token-driven
// so it re-themes per client.
export {
  crmTables,
  invoiceStatus,
  dealStage,
  activityType,
} from "./schema";
export {
  PIPELINE_STAGES,
  STAGE_MAP,
  OPEN_STAGES,
  adjacentStage,
  openPipelineValue,
} from "./pipeline";
export type { DealStage, StageDef, DealLike } from "./pipeline";
export {
  INVOICE_STATUSES,
  INVOICE_STATUS_MAP,
  invoiceTotals,
  formatMoney,
  formatDate,
  addMonths,
  firstFutureMonthly,
  nextMonthlyAfter,
  nextInvoiceNumber,
} from "./invoice";
export type { InvoiceItem, InvoiceStatus } from "./invoice";
