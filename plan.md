# LA Digital → Multi-Tenant AI Platform ("AI Engine")

> Living plan doc — the source of truth for this initiative. Update it at the end of every phase/step: check off completed items, note deviations, keep it in sync with reality.

## Progress log
- **2026-07-19** — Plan approved. Phase M (marketing overhaul) started. This file created and committed.

## Context

LA Digital today is a **single-tenant** Next.js 16 / React 19 / Convex app: one business, one global admin (a shared `ADMIN_WRITE_KEY` string + HMAC cookie), and 10 Convex tables with no tenant concept (three are literal singletons: `settings`, `availabilityRules`, `googleTokens`). It already has **mature, reusable tools**: Booking + Google Calendar, Email (Nodemailer + React-Email), Invoicing/Clients + PDFs, and an AI chat ("Leo"). The AI's knowledge, however, comes only from the static `lib/site-config.ts`, leads are emailed but never stored, and there is no SMS, first-party analytics, white-label, or embed capability.

The goal is to become a **multi-tenant AI platform** where the tools are built once and every business reuses them ("never build the same feature twice"): AI Chat, Business Knowledge, Dashboard, Booking, Leads, Email, SMS, Analytics — plus per-business white-label branding and revenue tiers.

**Decisions (locked):** tenant = each end-business (GroomHub/YardFlow are *templates*, not tenants); delivery = **embeddable widget** businesses paste on their own site; auth = **Convex Auth** (multi-user, replaces the single-admin); SMS = **Twilio**; **LA Digital becomes business #1** (dogfood), in **this repo**, with clean separation and **no duplication** — achieved by refactoring the current code into shared tenant-scoped tools, not copying it.

## Guiding architecture

1. **Three identity planes (keep strictly separate).**
   - **Platform plane** — LA Digital operators (super-admins) who can see/assist *every* business (cross-tenant support portal). Authorized by `requirePlatformAdmin`, audited.
   - **Dashboard plane** — a business's own logged-in members (owner/admin/staff), scoped to their `businessId` by membership. Authorized by `requireMember`.
   - **Public/widget plane** — unauthenticated; authorized by a **per-business embed API key + origin allow-list**, never by user identity.
   Conflating these is the #1 security risk.
2. **`businessId` is the partition key on every domain table.** No query runs without it; every existing index gets `businessId` prepended (`by_start` → `by_business_start`).
3. **Staff/provider is a sub-dimension below `businessId`.** A business has many **employees**, each a bookable resource with their own availability + calendar. Booking tables (`bookings`, `availabilityRules`, `googleTokens`, `googleBusy`) gain a `staffId`; slot generation is per-employee; managers see all schedules, an employee sees their own.
4. **De-singletonize** `settings` → per business; `availabilityRules`/`googleTokens`/`googleBusy` → per **staff** (with a business-level default fallback).
5. **Templates ≠ tenants.** GroomHub/YardFlow are JSON blueprints that clone into a `businesses` row + child rows on onboarding.
6. **LA Digital = business #1** (`slug:"ladigital"`), and its marketing pages keep reading Convex first-party (server components) — the widget is only for *customers'* external sites.

### Repo structure (separation + marketing performance, one codebase, no duplication)
Use App Router **route groups** so bundles stay separate while logic is shared once:
- `app/(marketing)/*` — LA Digital's public site (home, `/services`, `/work`, `/book`) + any tenant's first-party public pages. Its own layout; static/ISR where possible; reads only its tenant's data → **stays fast, never pulls in dashboard code.**
- `app/dashboard/[businessSlug]/(dash)/*` — the SaaS dashboard (ported from `app/admin/(dash)/*`), business switcher + branding + **staff/team management**.
- `app/platform/*` — LA Digital's cross-tenant **support portal** (super-admin only): list/inspect/assist every client business.
- `app/embed/*` + `public/widget.js` — the embeddable widget surface (iframe).
- `app/api/*` — tenant-scoped tool APIs (`/api/chat`, `/api/book`, `/api/sms`, `/api/event`).
- Shared tools live once in `convex/*` (tenant-scoped) and `lib/*` — imported where needed, tree-shaken per route group. **That's the no-duplication guarantee.**

### Modular tool architecture (every tool is its own module)
The platform is a set of **self-contained, pluggable tool modules** so a new tool can be added by dropping in one module — no edits scattered across the codebase ("never build twice", and easy to extend).
- **One module per tool** — each of `chat`, `booking`, `leads`, `email`, `sms`, `invoicing`, `analytics`, `knowledge` owns its Convex file(s) (`convex/<tool>.ts`, `"use node"` side-effects split into `convex/<tool>Node.ts`), its `lib/<tool>/*` client helpers, its dashboard page, and its schema tables. No tool reaches into another tool's internals — they interact only through exported functions.
- **Consistent module contract** — every tool exposes the same shape: tenant-scoped Convex `queries/mutations/actions` that all take `businessId` (+ `staffId` where relevant) and start with an authz call (`requireMember`/`resolveTenantByKey`). A tool never derives tenant from anything but its arguments/request context.
- **Shared tool registry for the AI** — the AI's callable tools (`check_availability`, `book_call`, `create_lead`, `send_followup`, …) live in one registry (`lib/ai/tools/*`), each entry declaring its JSON schema + a tenant-scoped handler that dispatches into the owning module. Adding an AI capability = adding one registry entry, nothing else.
- **AI Employees compose modules** (Phase 3) — an employee is just a named subset of registry tools + a persona; it adds no new primitives.

### Coding standards (apply throughout)
- **Migration code is temporary — remove it once the migration completes.** Backfill migrations, the `v.optional` widening shims, and any dual-path/back-compat code (running old HMAC admin alongside Convex Auth, the `<BOOK_CALL>` sentinel fallback) exist only to bridge the cutover. Delete each the moment its step is verified and narrowed, so no migration scaffolding lingers in the shipped codebase.
- **Match the existing codebase conventions exactly** — the same variable/function naming (camelCase fns, `by_business_*` index naming), spacing/formatting, and the terse, purposeful comment style already used in files like `convex/lib/requireAdmin.ts` and `lib/admin-session.ts` (comment *why*, not *what*). Read the neighbouring file before writing.
- **No legacy or outdated packages.** Use current APIs only — Next 16 (`proxy.ts`, async `cookies()/params`), Convex 1.39+ single-arg db ops, current `@convex-dev/auth` + official `@convex-dev/twilio` component. Per `AGENTS.md`, read the relevant guide in `node_modules/next/dist/docs/` and `convex/_generated/ai/guidelines.md` before writing, and heed deprecation notices. If a dependency is outdated, **update the package** rather than work around it.
- **No dead/duplicated code** — delete retired paths (`assertAdmin`, `ADMIN_WRITE_KEY`, old proxy gate, `<BOOK_CALL>` sentinels) once their replacement is verified; never leave two code paths for the same job.

---

## PHASE M — Marketing Overhaul (do FIRST, before any platform work)

**Goal:** reposition + redesign the public site to **lead with the AI Engine platform** — AI chat, booking, lead capture, embeddable widget, AI employees, tiered pricing — with the web/app/agency work as secondary. Ships against the **current single-tenant backend** (no tenancy yet). The routing/design/data plumbing stays; the work is rewriting copy/data, reframing sections, adding two new platform sections, and re-skinning. This also becomes business #1's seed content in PHASE 1.

**Keep as-is:** route structure, the `static site-config → Convex override → resolved` data flow, the dark orange-on-dark token system in `app/globals.css`, all `components/ui/*` primitives, the Leo widget (`components/leo/*`), booking flow, and the Work showcase. **Evolve, don't fork.**

### Positioning & data (`lib/site-config.ts` + `lib/types.ts`)
- Rewrite `company.tagline`/`heroHeadline`/`heroSubheadline` and `valueProps` to lead with the AI Engine ("Deploy an AI assistant that chats, books, and captures leads on your site — paste one snippet"). Keep the Ottawa/agency identity but demote it.
- **Restructure `services` categories to lead with platform tiers.** Add a primary category (e.g. `platform-tiers`: **Starter / Professional / Enterprise**) built from the AI capabilities; keep today's Platform Plans/Growth/Add-ons as the **secondary "we also build" agency** offering. Extend the `ServiceCategory`/`ServicePackage` types in `lib/types.ts` only if needed (e.g. a `kind: "platform" | "agency"` discriminator) — reuse existing shapes otherwise.
- Pricing still renders from Convex `plans` (editable in admin) with the static category as fallback — so seed the new tiers as `plans` rows via the existing admin, no schema change. Reuse `lib/use-plans.ts effectivePackages()`/`cheapestPackage()`.
- Rewrite `lib/faq.ts` (10 Q&As reference old plan names/prices) around the platform + tiers.

### Homepage (`app/page.tsx` + `components/sections/*`)
New render order, reusing existing section components where possible:
1. **Hero** (`hero.tsx`) — new eyebrow (AI platform, not "Business platform · Subscription · Ottawa"), new headline/sub from updated `settings`/site-config, CTAs → "See how it works" (`/#how`) and "Book a demo" (`/book`). Keep the `/hero.mp4` + `.hero-mask`/`.bg-grid` treatment.
2. **PlatformTools** — *new* `components/sections/platform-tools.tsx`: the tool grid (Chat, Booking, Leads, Email/SMS, Analytics, AI Employees, White-label) using existing `ServiceCard`/`Icon`/`Reveal` primitives. Reframes the old `services-teaser.tsx` idea toward capabilities.
3. **HowItWorks / WidgetDemo** — *new* `components/sections/how-it-works.tsx`: the "paste one `<script>` → your AI assistant goes live" story (a stylized embed snippet + a live "try it" pointer to the existing Leo launcher). Sets up the PHASE-2 widget.
4. **Pricing/Tiers teaser** — reuse `services-teaser.tsx`/`ServiceCard` re-pointed to the new platform tiers (Starter/Pro/Enterprise) as primary, with a link to `/services`.
5. **SelectedWork** (`selected-work.tsx`) — keep (proof), lightly reframed as "built by the same team."
6. **WhyChooseUs** (`why-choose-us.tsx`) — reframe value props to platform outcomes.
7. **Process** (`process.tsx`) — reframe to onboarding ("connect knowledge → embed → go live").
8. **Faq** (`faq.tsx`) + **ContactSection** (`contact-section.tsx`) — keep; contact prefill (`?service=`,`?package=`) still works.

### Pricing pages
- `app/services/page.tsx` + `components/sections/services-full.tsx` — lead with platform tiers (primary grid via `PackageCard`, highlight Professional), agency plans in a secondary section below. Update H1/copy.
- `app/plans/[slug]/page.tsx` — extend the per-slug `PLAN_SEO` map for the new tier slugs (`starter`/`professional`/`enterprise`); keep the Convex `plans.getPublic` + static fallback resolution.

### Chrome, SEO, metadata
- `components/layout/site-header.tsx` + `mobile-menu.tsx` — update `NAV` (Home / Platform (`/#tools`) / How it works (`/#how`) / Pricing (`/services`) / Contact); keep scroll-spy (`lib/use-active-section.ts`) and the "Book a demo" CTA.
- `components/layout/site-footer.tsx` — update sitemap links + description; keep `SecretAdminLogo` + `SocialLinks`.
- Update metadata/OG in `app/page.tsx`, `app/services/page.tsx`, `app/layout.tsx`, and `lib/site-config.ts seo` for the AI-platform positioning (SEO keywords already lean this way — extend them).

### Design direction — apply the `frontend-design` skill
Drive the redesign with the frontend-design methodology (distinctive, production-grade, not cookie-cutter). Do the **design thinking before coding**:
- **Purpose** — convert business owners to adopt the AI Engine: make "paste one snippet → an AI assistant that chats, books, and captures leads goes live on your site" feel inevitable and premium. Audience: SMB owners/operators, not developers.
- **Tone** — push beyond today's restrained dark theme to a deliberate **"technical luxury / editorial-dark"** direction: confident, kinetic, high-contrast, with the AI "engine" as a living motif. Extreme enough to be memorable; still on-brand (orange-on-near-black).
- **Constraints** — Next 16 + Tailwind v4 CSS-first tokens, `motion/react`, existing `components/ui/*`. **Evolve the token system, don't fork it**: keep `brand-orange`/`ink` core; extend `@theme` in `globals.css` only for genuinely new accents (e.g. a secondary gradient, a texture).
- **Differentiation (the signature element)** — a **live AI motif woven into the hero**: the assistant visibly "typing"/answering (tie to the existing Leo surface) or a kinetic "engine" visual, so the product demonstrates itself above the fold. This is the one unforgettable moment.

Execution principles from the skill:
- **Typography** — pair a **characterful display font** for headlines with a clean body face; move off all-Geist/Inter defaults for headings (avoid overused picks like Space Grotesk). Load via `next/font`; keep body legible.
- **Motion** — one orchestrated page-load with **staggered reveals** (extend the existing `Reveal`/`motion` usage), scroll-triggered section transitions, and tasteful hover surprises on tool/tier cards. Respect the existing reduced-motion block in `globals.css`.
- **Spatial composition** — break the current centered, symmetric section stack: introduce **asymmetry, overlap, diagonal flow, and grid-breaking** accents (e.g. an offset hero, overlapping tool cards, a diagonal "how it works" band). Balance negative space with controlled density.
- **Visual details** — layered transparencies, gradients, subtle texture/grid (reuse `.bg-grid`/`.hero-mask`, add depth), glow accents already in the token set.
- **Anti-patterns to avoid** — generic fonts, predictable three-column-everything layouts, flat AI-default palettes, uniform card grids with no focal hierarchy.

Apply this section-by-section across the Phase M homepage + `/services`; keep it production-grade (real components, not throwaway), matching code complexity to the aesthetic.

**No backend/schema changes in Phase M** — content flows through the existing `site-config` + Convex `settings`/`plans`. Verify: `npm run build` green; home + `/services` + `/plans/[slug]` render the new positioning with Convex overrides still editable in admin; Lighthouse/first-paint unchanged (marketing stays static-first).

---

## PHASE 0 — Tenancy Foundation + Auth (load-bearing; ship before any feature)

**Convex Auth** (`labs.convex.dev/auth`): `npm i @convex-dev/auth @auth/core`, `npx @convex-dev/auth`; add `convex/auth.ts` (Password + optional Google), `convex/auth.config.ts`, spread `...authTables` into `convex/schema.ts` (managed `users`). Next side: `ConvexAuthNextjsServerProvider`, replace the HMAC `proxy.ts` gate with `convexAuthNextjsMiddleware` (matcher `/dashboard/:path*`). Functions read the caller via `getAuthUserId(ctx)`.

**New tables:**
- `businesses` — `slug`(unique), `name`, `status`, `domains: string[]` (widget allow-list), `embedKeyHash` + `embedKeyPrefix`, `branding{logoStorageId?,primaryColor,accentColor,chatIcon,position,assistantName,welcomeMsg,tone}`, `aiSettings{persona,model?,guardrails?}`, `tier`, `templateId?`. Indexes: `by_slug`, `by_embedKeyPrefix`, `by_domain`.
- `memberships` — `userId`, `businessId`, `role:"owner"|"admin"|"staff"`. Indexes `by_user`, `by_business`, `by_user_business`. (A user may belong to many businesses.) `owner`/`admin` = **manager** (sees all staff); `staff` = employee (sees own).
- `staff` — `businessId`, `userId?` (optional link to a login account — null = manager-managed resource with a calendar but no login), `name`, `email?`, `title`, `bookable:boolean`, `serviceIds?:string[]` (which services they offer), `active`, `order`. Indexes `by_business`, `by_business_active`, `by_user`.
- `platformAdmins` — `userId`, `role:"support"|"superadmin"`, `createdAt`. Index `by_user`. The allow-list of LA Digital operators who can access the cross-tenant support portal. (Seed the owner as `superadmin`.)
- `auditLog` — `actorUserId`, `scope:"platform"|"business"`, `businessId?`, `action`, `targetId?`, `meta`, `ts`. Index `by_business_ts`, `by_actor_ts`. Records platform-admin cross-tenant actions (and sensitive business actions).

**Add `businessId` + reindex all 10 existing tables** (`settings`, `plans`, `projects`, `bookings`, `availabilityRules`, `blackoutDates`, `googleTokens`, `googleBusy`, `clients`, `invoices`); `settings` becomes one-row-per-business. **Add `staffId` to `bookings`, `availabilityRules`, `googleTokens`, `googleBusy`** (these are per-employee, keyed by `staffId`; a `staffId:null`/business-default row is the fallback when a business has a single shared calendar). New indexes: `bookings.by_business_staff_start`, `availabilityRules.by_staff`, `googleTokens.by_staff`, `googleBusy.by_staff_start`.

**Authorization refactor** — replace `convex/lib/requireAdmin.ts assertAdmin(adminKey)` with `convex/lib/authz.ts`:
- `requireMember(ctx, businessId, minRole?)` — dashboard functions: `getAuthUserId` → load membership `by_user_business` → throw if absent/below role. Every admin mutation swaps `assertAdmin(args.adminKey)` → `await requireMember(ctx, args.businessId)` and **drops the `adminKey` arg**.
- `resolveTenantByKey(ctx, embedKey, origin)` — widget/public: look up `businesses` by `embedKeyPrefix`, verify hash, check `origin ∈ domains[]`.
- `requirePlatformAdmin(ctx, minRole?)` — platform/support functions: `getAuthUserId` → check `platformAdmins by_user`; grants cross-tenant read (and, for `superadmin`, assist/act-as) regardless of membership. Every call writes an `auditLog` row.
- `requireCapability(ctx, businessId, cap)` — tier gating (Phase 3).
- **Employee visibility helper** — dashboard booking queries take the caller's membership: a manager (`owner`/`admin`) may pass any `staffId` (or none = all); a `staff` member is forced to their own linked `staffId`.
Server actions (`app/actions/admin-*.ts`) stop injecting `ADMIN_WRITE_KEY`; they pass `businessId` (from the logged-in user's active business, e.g. `/dashboard/[businessSlug]`) and rely on Convex Auth forwarding identity. Retire `lib/admin-auth.ts`, `ADMIN_WRITE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.

**Public/widget tenant resolution:** embed key (widget) → business slug (first-party) → `Origin` cross-check against `domains[]`.

**Data migration — ZERO DATA LOSS is a hard requirement.** All current LA Digital data (settings, plans, projects, bookings, availability, Google tokens/busy, clients, invoices) must survive intact and stay live. Approach: `@convex-dev/migrations`, widen→migrate→narrow (adds columns to existing rows in place — never drops or recreates a table):
0. **Snapshot first** — `npx convex export` a full backup of the deployment before touching the schema, so the pre-migration state is recoverable.
1. **Widen** — add `businessId` (and `staffId` on the four booking tables) as `v.optional`, deploy. Existing rows keep all their data; app still works (functions treat missing = business #1 during transition).
2. **Migrate (additive only)** — seed the `businesses` #1 row (`ladigital`, tier enterprise), the owner `memberships` + `platformAdmins` rows, and a default `staff` row (`staffId:null` calendar); then a migration **stamps** `businessId` (and default `staffId`) onto every existing row via `ctx.db.patch` — no deletes, no re-inserts. Each singleton (`settings`/`availabilityRules`/`googleTokens`) simply becomes business #1's row.
3. **Verify counts** — assert per-table row counts are unchanged and every row now carries a `businessId` before proceeding (see Verification).
4. **Narrow** — only after verification: make `businessId` required and drop the now-redundant `settings.key` field. Old data is fully preserved under business #1.

---

## PHASE 1 — Foundation: Knowledge, Chat, Dashboard

- **Per-tenant knowledge** — new `knowledge` table (`businessId`, company, services[], pricing, hours, locations[], faq[], policies[]). Generalize `lib/get-settings.ts`/`lib/use-settings.ts`/`lib/use-plans.ts` to take `businessId`. New dashboard **Knowledge editor** reusing form patterns from `app/admin/(dash)/content` + `pricing`. `lib/site-config.ts` becomes only the seed/blueprint for business #1 + template source (not read by the AI at runtime).
- **Per-tenant Leo prompt** — generalize `lib/leo-prompt.ts buildLeoSystemBlocks()` → `(business, knowledge)`: inject `branding.assistantName`/`tone`/`welcomeMsg` + the tenant knowledge block; keep `sortedJSON` + ephemeral `cache_control` (now cached per-business).
- **Move Leo to real Anthropic tool-use** (retire `<BOOK_CALL>`/`<LEAD_CAPTURE>` sentinels). Shared **tool registry** — `check_availability`, `book_call`, `create_lead`, `send_followup` — each handler tenant-scoped (takes resolved `businessId` from request context, never from the model), dispatching into existing Convex fns (`api.slots.*`, `api.bookings.book`, new `api.leads.create`). Keep sentinels alive for business #1 until tool-use is verified, then flip. (`claude-haiku-4-5` supports tool use.)
- **Dashboard shell** at `app/dashboard/[businessSlug]/(dash)/*` ported from `app/admin/(dash)/*` + business switcher + branding page + a **Team page** (managers invite employees via Convex Auth, assign `role`, mark bookable, set services; add login-less bookable staff; each employee gets their own calendar-connect action). `/admin` redirects to `/dashboard/ladigital` during transition.

---

## PHASE 2 — Automation: Booking, Leads, Email, SMS

- **Booking tenant- + employee-aware** — `convex/bookings.ts|slots.ts|availability.ts` take `businessId` **and `staffId`**; use the `by_business_staff_*` indexes (double-booking-safety + tokenized reschedule/cancel reused as-is, now per employee).
  - **Slot generation per employee** — `slots.ts` computes availability from that staff's `availabilityRules` + their `googleBusy` + existing bookings. A business with one shared calendar uses the `staffId:null` default row (back-compat with LA Digital #1).
  - **Assignment = pick or auto**: the booking widget/AI can request a specific `staffId`, or `"any"` → an `assignStaff(businessId, serviceId, startUtc)` helper picks among bookable, service-matching, free employees by **round-robin / least-busy**. The chosen `staffId` is written on the booking.
  - **Manager vs employee views** — dashboard booking calendar: managers see all employees (grouped/color-coded per staff); a `staff` user sees only their own via the visibility helper.
  - **Per-employee Google OAuth (key risk):** each employee connects **their own** calendar. Thread **both `businessId` and `staffId`** through a **signed `state`** param in `convex/http.ts` `/google/connect`→`/google/callback`→`exchangeAndStore`; `authedCalendar(ctx, businessId, staffId)` loads that employee's `googleTokens`. One global redirect URI; `state` carries tenant + staff. The connect page lives per-employee in the dashboard.
- **Leads CRM (net-new)** — `leads` table (`businessId`, name/email/phone/message, `source`, `status` pipeline, `assignedTo?`, `followUpAt?`, notes[]). `api.leads.create` called by the `create_lead` tool + `app/actions/booking.ts` + `app/actions/contact.ts`. Dashboard kanban reusing `clients` list/action patterns; promote lead → `clients`.
- **Email per tenant** — generalize `lib/mailer.ts` + `lib/booking-emails.ts` for per-tenant sender identity; `emails/*` take branding props. Starter tier uses shared LA Digital sender; Pro+ custom domain (SPF/DKIM onboarding step).
- **SMS via Twilio (net-new)** — use the official `@convex-dev/twilio` component (`convex/convex.config.ts` `app.use(twilio)`, webhook routes in `http.ts`). Per-tenant number/config; `"use node"` `sendSms(businessId,to,body)`; inbound webhook resolves tenant by destination number (validate signatures). Booking events fan out to email + SMS.
- **Cron fan-out** — convert `convex/crons.ts syncBusy` and the Vercel `app/api/cron/recurring-invoices/route.ts` into orchestrators that iterate `businesses` and schedule per-business work (Convex `scheduler` fan-out; loop-with-`businessId` for the Vercel route). Add a reminders/follow-ups cron.

---

## Embeddable Widget (cross-cutting; build after Phase 0)

- **`public/widget.js`** — the `<script>` businesses paste; reads `data-embed-key`, fetches branding via public `getWidgetConfig(embedKey, origin)`, injects a floating bubble, mounts an **iframe** → `app/embed/page.tsx` (renders `components/leo/*` verbatim, themed).
- **Tenant-scoped `app/api/chat/route.ts` + `app/api/book/route.ts`** (successors to `/api/leo`): resolve tenant via embed key + `Origin`; set `Access-Control-Allow-Origin` to the specific origin **only if ∈ `domains[]`** (never `*`), handle preflight; build per-tenant prompt + dispatch tool calls. Embed page sets CSP `frame-ancestors` to allowed domains.
- **Embed key** generated at business creation, stored **hashed**; dashboard shows/rotates (rotation invalidates immediately).
- **Durable per-tenant rate limiting** replaces in-memory `lib/leo-rate-limit.ts` (Convex rate-limiter component or Upstash), keyed by `businessId` + IP; also enforces tier message quotas.

## Analytics (Phase 2–3)
`events` table (`businessId`, `type:"pageview"|"chat"|"lead"|"booking"|"conversion"`, sessionId?, meta, ts; indexes `by_business_ts`, `by_business_type_ts`). Captured from widget (`/api/event`) + server-side on lead/booking. Daily rollups via per-business cron fan-out → `dailyRollups` table for fast charts. Per-business analytics dashboard.

## PHASE 3 — AI Employees + White-Label + Tiers
- **AI Employees = compositions** (no new primitives): a named bundle of shared tools + persona per business (Receptionist = availability+book+lead; Sales = lead+follow-up; Review = post-booking SMS/email). All dispatch into the same tenant-scoped functions.
- **White-label** — `businesses.branding` flows to widget (via `getWidgetConfig`), emails, and invoice PDFs (`lib/invoice-pdf*.ts`).
- **Tiers** — static `TIERS` capability map (`smsEnabled`, `customDomainEmail`, `maxAIEmployees`, `aiMessagesPerMonth`, …) enforced server-side via `requireCapability`.

## Platform Support Portal (cross-tenant, LA Digital operators only; buildable after Phase 0)

A separate top-level surface at `app/platform/*`, gated by `requirePlatformAdmin` (not per-business membership), so LA Digital staff can see and assist every client:
- **Businesses index** — all `businesses` with tier, status, owner, member/staff counts, connected-calendar + widget-embed health, last activity.
- **Business detail** — drill into one client: their members/staff, knowledge, plans, bookings, leads, invoices, analytics rollups — to diagnose/support. Reuses the same tenant-scoped queries the dashboard uses, just authorized via `requirePlatformAdmin` instead of `requireMember`.
- **Assist / act-as** (superadmin) — optionally impersonate a business to fix config on the owner's behalf; every action writes an `auditLog` row (`scope:"platform"`). Impersonation is time-boxed and clearly banner-flagged in the UI.
- **Platform-wide metrics** — total businesses, MRR by tier, aggregate usage, so LA Digital can run the platform.
- Convex side: a `convex/platform.ts` module whose every query/mutation starts with `await requirePlatformAdmin(ctx)` and iterates across `businesses` (the only place cross-tenant reads are allowed). Seed the owner into `platformAdmins` during the Phase-0 migration.

---

## Biggest risks
1. **Auth rewrite** (single-key → Convex Auth + membership) — run both in parallel during migration; cut modules one at a time (settings→plans→projects→bookings→invoices/clients); remove `ADMIN_WRITE_KEY` only after all are on `requireMember`. Widen→migrate→narrow so the DB is never broken.
2. **Per-employee Google OAuth** — sign/verify **both `businessId` and `staffId`** in OAuth `state` (prevents CSRF + connecting a calendar to the wrong tenant *or the wrong employee*). `googleBusy` cron now fans out per **staff**, not just per business.
3. **Cron fan-out** — orchestrate per-business → per-staff; schedule small jobs, don't run one giant loop.
4. **Widget security** — never reflect `Origin:*`; allow-list per business; hash + rotate embed keys; CSP `frame-ancestors`; durable per-tenant rate limit.
5. **No data loss + keep LA Digital shippable** — `npx convex export` snapshot before migrating; the migration is **additive only** (`ctx.db.patch`, never drop/recreate); verify row counts match the backup before narrowing. It's business #1; its marketing pages stay first-party server components (no CORS), bookable + editable at every migration step. LA Digital #1 starts with a single `staffId:null` default calendar so today's booking flow keeps working before employees are added.
6. **Platform-admin blast radius** — `requirePlatformAdmin` bypasses tenant isolation, so it's the highest-privilege path: keep the `platformAdmins` allow-list tiny, audit every action, time-box impersonation, and banner-flag act-as sessions. A bug here leaks *all* tenants.
7. **Employee visibility leak** — a `staff` user must never see other employees' bookings/leads; enforce the forced-`staffId` visibility helper server-side in every dashboard booking query, never trust a client-supplied `staffId`.

## Recommended build order (each step ships)
0. **PHASE M — marketing overhaul** (reposition + redesign to lead with the AI Engine, driven by the `frontend-design` skill; no backend change). Commit `plan.md` as part of this first step.
1. Convex Auth alongside old admin (both work). 2. Widen schema + seed business #1 + owner membership + owner as `platformAdmin` + a default `staffId:null` calendar. 3. Backfill `businessId`. 4. Cut server actions → identity + `businessId`, module by module (add `requireMember`). 5. Narrow schema; delete `assertAdmin`/`ADMIN_WRITE_KEY`/old proxy gate. 6. Per-tenant knowledge + Leo prompt + tool-use. 7. **Staff/team model + per-employee booking + assignment + per-employee Google OAuth + manager/employee views.** 8. Leads + email/SMS per tenant + cron fan-out. 9. Widget + tenant-scoped `/api/chat`,`/api/book` + durable rate limit. 10. **Platform support portal** (cross-tenant) + audit log. 11. Analytics, AI Employees, white-label, tiers.

## Critical files
**Phase M (marketing):** `lib/site-config.ts` + `lib/types.ts` + `lib/faq.ts` (reposition copy/data + tiers); `app/page.tsx` + `components/sections/{hero,services-teaser,why-choose-us,selected-work,process,faq,contact-section}.tsx` (reframe) + new `components/sections/{platform-tools,how-it-works}.tsx`; `app/services/page.tsx` + `components/sections/services-full.tsx` + `app/plans/[slug]/page.tsx` (tiers); `components/layout/{site-header,mobile-menu,site-footer}.tsx` (nav/footer); `app/globals.css` + `components/ui/*` (re-skin, reuse). Seed new tier rows via the existing admin (`convex/plans.ts`, no schema change).

**Platform (Phases 0–3):**
- `convex/schema.ts` — add `businesses`/`memberships`/`staff`/`platformAdmins`/`auditLog`/`knowledge`/`leads`/`events`, `...authTables`, `businessId` on all 10 tables + `staffId` on `bookings`/`availabilityRules`/`googleTokens`/`googleBusy` + reindex.
- `convex/lib/requireAdmin.ts` → new `convex/lib/authz.ts` (`requireMember`, `resolveTenantByKey`, `requirePlatformAdmin`, `requireCapability`, employee-visibility helper).
- `convex/bookings.ts` / `convex/slots.ts` / `convex/availability.ts` — `businessId` + `staffId`; per-employee slot generation + `assignStaff` round-robin/least-busy.
- `lib/leo-prompt.ts` — per-tenant prompt + persona + tool-use.
- `app/api/leo/route.ts` → tenant-scoped `app/api/chat/route.ts` (CORS/origin allow-list + tool dispatch).
- `convex/google.ts` + `convex/http.ts` — `businessId` **+ `staffId`** through OAuth `state`; per-employee tokens; Convex Auth + Twilio routes.
- `app/actions/admin-*.ts` — drop `ADMIN_WRITE_KEY`, pass `businessId`, `requireMember`.
- New: `convex/auth.ts`, `convex/auth.config.ts`, `convex/staff.ts`, `convex/platform.ts`, `convex/leads.ts`, `convex/analytics.ts`, `convex/sms.ts`, `public/widget.js`, `app/embed/*`, `app/dashboard/[businessSlug]/(dash)/*` (incl. Team page), `app/platform/*`.

## Verification (per phase)
- **Phase M:** `npm run build` green; home + `/services` + `/plans/[slug]` render the new AI-Engine positioning; Convex overrides still editable in admin; marketing stays static-first (first-paint unchanged).
- **Phase 0 (data safety):** take `npx convex export` before migrating; after the backfill, assert **every table's row count is identical to the backup** and that every existing row now has `businessId` = business #1 (no orphans, nothing dropped). Spot-check that current settings/plans/projects/bookings/clients/invoices render exactly as before on the live site. Only then narrow the schema. Keep the export as a rollback.
- **Phase 0 (isolation):** sign up two businesses via Convex Auth; confirm user A (member of biz 1) cannot read/write biz 2's data (membership scoping); the marketing site + `/dashboard/ladigital` still book/edit end-to-end. `npx convex run` cross-tenant read attempts throw.
- **Phase 1:** edit business #1 knowledge → Leo answers from Convex (not `site-config`); a second business with different knowledge/persona answers differently; tool-use `check_availability`/`book_call` books through the existing engine.
- **Phase 2 (staff):** a business with 2+ employees — each employee connects their *own* Google Calendar (via `state` carrying `businessId`+`staffId`); the widget shows per-employee slots; "any available" round-robins; a manager sees both employees' calendars while an employee logged in sees only their own; a booking assigned to employee A never blocks employee B's slots; a login-less bookable staff can still be booked by the manager.
- **Phase 2 (tenants):** two businesses each connect their own calendar; a booking on biz 1 never appears on biz 2; leads persist to the CRM; SMS reminder sends via Twilio; recurring-invoice + free/busy crons fan out per business → per staff.
- **Platform portal:** a `platformAdmins` user opens `/platform`, lists all businesses, drills into one to view its bookings/leads/invoices; a non-platform user gets 403; an act-as session writes `auditLog` rows and shows the impersonation banner.
- **Widget:** paste `widget.js` (with biz 1's embed key) on a separate localhost origin listed in `domains[]` → chat/book works; the same key from a non-listed origin is rejected (CORS + `frame-ancestors`); rotating the key breaks the old embed.
- **Phase 3:** tier gating blocks SMS on Starter server-side; white-label branding shows the tenant's logo/colors/assistant name in widget + emails + PDF.
- Run `npm run build` + `npx convex deploy` green before each phase ships.
