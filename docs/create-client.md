# Create a new client site (build once, drop in)

This monorepo ships reusable packages so a new client is mostly **theming**, not
rebuilding. A client gets a site; booking and CRM drop in from packages and
re-theme from one `BrandConfig` + the `@theme` tokens.

- `@ladigital/theme` — `BrandConfig` → email + invoice-PDF palettes/identity
- `@ladigital/ui` — token-driven primitives (Button, Section, …)
- `@ladigital/admin-kit` — toast, confirm dialog, form fields
- `@ladigital/email` — `createEmailKit(brand)` themed React-Email shell
- `@ladigital/booking` — slot/time/rules cores **+ `bookingTables` schema fragment**
- `@ladigital/crm` — clients + invoices + leads/pipeline **+ `crmTables` schema fragment**

Each client gets **their own Convex deployment**, so data is isolated at the
deployment level — no multi-tenant scoping.

---

## 1. Scaffold

```bash
npm run create-client -- <slug> "Display Name"
# e.g.
npm run create-client -- acme-dental "Acme Dental"
```

This copies `apps/ladigital` → `apps/<slug>` (skipping `node_modules`, `.next`,
`.turbo`, Convex `_generated`, and any `.env*`), renames the workspace, drops a
fresh **`lib/brand.ts`** stub with `TODO`s, and writes `apps/<slug>/SCAFFOLD.md`.

```bash
npm install   # link the new workspace
```

## 2. Theme it (the only real per-client work)

Fonts + colors live in two places that must agree (the web reads CSS vars; email
and the invoice PDF can't, so they read the hex in `brand.ts`):

1. **`apps/<slug>/lib/brand.ts`** — fill every `TODO`: identity, `colors` (hex),
   `fonts`, `contact`, `invoice` (currency/tax/locale), `timezone`,
   `meetingTitle`/`meetingNoun`.
2. **`apps/<slug>/app/globals.css`** — set the `@theme` color tokens to the same
   hex values as `brand.colors`.
3. **`apps/<slug>/app/layout.tsx`** — if using custom fonts, swap the `next/font`
   faces and point `--font-display/body/mono` at them.
4. **`apps/<slug>/lib/site-config.ts`** and `components/sections/*` — replace the
   marketing copy/sections for this client.

> Booking flow, availability picker, admin, kanban, emails, and the invoice PDF
> all re-theme automatically from the above — no component edits.

## 3. Provision this client's own Convex

```bash
npm exec -w <slug> -- convex dev
```

First run creates a **new Convex project/deployment** and writes its
`_generated` + `CONVEX_DEPLOYMENT` to `apps/<slug>/.env.local`. The schema spreads
`...bookingTables` + `...crmTables`, so all tables are created automatically.

## 4. Environment (per deployment)

Set on the Convex deployment and/or `apps/<slug>/.env.local` as noted in the
reference app:

| Purpose | Vars |
| --- | --- |
| Admin auth | `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ADMIN_WRITE_KEY` |
| Email (SMTP) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` |
| Google Calendar | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| Crons | `CRON_SECRET` |
| Email logo (optional) | `EMAIL_LOGO_URL` (public HTTPS; else an initials badge is used) |
| Omnivo AI (optional) | `AGENT_API_KEY` — only if this client uses Omnivo AI. See [agent-api.md](./agent-api.md) |

Then connect Google Calendar from `/admin/connect`, and set bookable hours in
`/admin/availability`.

## 5. Deploy

- **Vercel:** new project, **root directory = `apps/<slug>`**. Add the same env.
- **Crons:** `apps/<slug>/vercel.json` already schedules recurring invoices +
  booking reminders.
- **Convex (prod):** `npm exec -w <slug> -- convex deploy` for the production
  deployment when going live.

---

## What "drop in later" looks like

Both booking and CRM are already wired in the scaffold. If you start a client on
a plain site and add a capability later, it's the same two moves:

- **Booking:** ensure `convex/schema.ts` spreads `...bookingTables`, keep the
  booking `convex/*` functions + `/book` route, redeploy Convex.
- **CRM:** ensure `convex/schema.ts` spreads `...crmTables`, keep `convex/crm.ts`
  + `/admin/crm`, redeploy Convex.

Because the tables are package fragments and the UI is token-driven, adding a
capability is spread-a-fragment + redeploy — not a rebuild.
