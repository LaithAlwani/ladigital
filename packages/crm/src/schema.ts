import { defineTable } from "convex/server";
import { v } from "convex/values";

// ----------------------------------------------------------------------------
// @ladigital/crm schema — the CRM table fragments a client app spreads into its
// own Convex schema (`...crmTables`). Data is isolated per client because each
// app has its own Convex deployment, so no per-tenant scoping is needed.
//
// Covers the reusable clients + invoices tables AND the leads/pipeline
// (contacts → deals through stages, with activities + tasks).
// ----------------------------------------------------------------------------

export const invoiceStatus = v.union(
  v.literal("draft"),
  v.literal("sent"),
  v.literal("paid"),
  v.literal("cancelled"),
);

/** Pipeline stage a deal sits in. */
export const dealStage = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("qualified"),
  v.literal("won"),
  v.literal("lost"),
);

/** Kind of a logged activity on a contact/deal. */
export const activityType = v.union(
  v.literal("note"),
  v.literal("call"),
  v.literal("email"),
  v.literal("meeting"),
  v.literal("stage-change"),
);

export const crmTables = {
  // Saved clients — reusable bill-to details for invoices.
  clients: defineTable({
    name: v.string(), // contact name
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),

  // Client invoices — created in the admin, exported as branded PDFs.
  invoices: defineTable({
    number: v.string(), // e.g. "INV-1001"
    clientName: v.string(),
    clientCompany: v.optional(v.string()),
    clientEmail: v.optional(v.string()),
    clientAddress: v.optional(v.string()),
    items: v.array(v.object({ description: v.string(), amount: v.number() })),
    taxRate: v.number(), // percent, e.g. 13 for 13% HST
    currency: v.string(), // e.g. "CAD"
    issueDate: v.number(), // epoch ms
    dueInDays: v.number(), // editable; dueDate derives from issueDate + this
    dueDate: v.number(), // epoch ms
    notes: v.optional(v.string()),
    status: invoiceStatus,
    // When `recurring`, a cron generates a fresh copy each month; `nextRunAt`
    // is the next scheduled generation time (epoch ms).
    recurring: v.optional(v.boolean()),
    nextRunAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_number", ["number"])
    .index("by_created", ["createdAt"]),

  // Leads/pipeline — a person (or company) at the top of the funnel.
  contacts: defineTable({
    name: v.string(),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.optional(v.string()), // "booking" | "contact-form" | "manual" | …
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_created", ["createdAt"])
    .index("by_email", ["email"]),

  // An opportunity moving through the pipeline stages.
  deals: defineTable({
    title: v.string(),
    contactId: v.optional(v.id("contacts")),
    value: v.optional(v.number()), // expected amount
    stage: dealStage,
    order: v.number(), // position within its stage column
    closeDate: v.optional(v.number()), // epoch ms
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_stage", ["stage", "order"])
    .index("by_contact", ["contactId"]),

  // Timeline entries logged against a contact and/or deal.
  activities: defineTable({
    contactId: v.optional(v.id("contacts")),
    dealId: v.optional(v.id("deals")),
    type: activityType,
    body: v.string(),
    createdAt: v.number(),
  })
    .index("by_contact", ["contactId"])
    .index("by_deal", ["dealId"]),

  // Follow-up to-dos linked to a contact and/or deal.
  tasks: defineTable({
    title: v.string(),
    contactId: v.optional(v.id("contacts")),
    dealId: v.optional(v.id("deals")),
    dueAt: v.optional(v.number()), // epoch ms
    done: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_due", ["dueAt"])
    .index("by_done", ["done"])
    .index("by_contact", ["contactId"])
    .index("by_deal", ["dealId"]),
};
