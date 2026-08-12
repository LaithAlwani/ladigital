#!/usr/bin/env node
// ---------------------------------------------------------------------------
// create-client — scaffold a new client app from the reference app (ladigital).
//
//   node scripts/create-client.mjs <slug> ["Display Name"]
//   npm run create-client -- <slug> ["Display Name"]
//
// It copies apps/ladigital -> apps/<slug> (skipping node_modules, build output,
// Convex codegen, and secrets), renames the workspace, and drops a fresh,
// self-contained BrandConfig stub to fill. Everything else (booking, CRM,
// admin, emails, packages wiring) comes along and re-themes from that config +
// the @theme tokens in app/globals.css.
//
// After scaffolding, follow the checklist it prints (and docs/create-client.md).
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const SOURCE_APP = "ladigital";

const slug = process.argv[2];
const displayName = process.argv[3] || null;

if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error(
    "Usage: node scripts/create-client.mjs <slug> [\"Display Name\"]\n" +
      "  <slug> must be kebab-case (a-z, 0-9, -), e.g. acme-dental",
  );
  process.exit(1);
}

const src = path.join(repoRoot, "apps", SOURCE_APP);
const dest = path.join(repoRoot, "apps", slug);

if (!fs.existsSync(src)) {
  console.error(`Source app not found: ${src}`);
  process.exit(1);
}
if (fs.existsSync(dest)) {
  console.error(`Target already exists: apps/${slug} — pick another slug or remove it first.`);
  process.exit(1);
}

// Directory/file names never copied (per-deployment, generated, or secret).
const SKIP_DIRS = new Set(["node_modules", ".next", ".turbo", ".git", "_generated"]);
const isEnvFile = (name) => name === ".env" || name.startsWith(".env.");
const isBuildArtifact = (name) => name.endsWith(".tsbuildinfo");

fs.cpSync(src, dest, {
  recursive: true,
  filter: (source) => {
    const base = path.basename(source);
    if (SKIP_DIRS.has(base)) return false;
    if (isEnvFile(base) || isBuildArtifact(base)) return false;
    return true;
  },
});

// 1) Rename the workspace package.
const pkgPath = path.join(dest, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.name = slug;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// 2) Drop a fresh, self-contained BrandConfig stub for the client to fill.
const title = displayName || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const initials = title
  .split(/\s+/)
  .map((w) => w[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

const brandStub = `import { defineBrand } from "@ladigital/theme";

// ${title}'s brand/theme config — the ONE per-site source the email templates
// and invoice PDF derive their palette + identity from. The web UI re-themes via
// app/globals.css \`@theme\` + next/font, so keep the hex values below in sync
// with the tokens in globals.css. (Email/PDF can't read CSS vars, hence hex.)
//
// TODO: fill in every value marked TODO, then update app/globals.css @theme.
export const brand = defineBrand({
  identity: {
    name: "${title}",
    legalName: "${title}", // TODO: legal entity name
    tagline: "TODO tagline",
    logoUrl: process.env.EMAIL_LOGO_URL?.trim() || undefined,
    wordmarkInitials: "${initials}",
  },
  colors: {
    brand: "#ff6a00", // TODO: primary accent
    brandSoft: "#ff8a3d", // TODO
    brandDeep: "#d95800", // TODO
    ink: "#fafaf9", // page background
    surface: "#ffffff", // cards
    surface2: "#f1f2f0", // subtle fills
    border: "#e6e7e4", // solid border for email/PDF
    foreground: "#14181f", // primary text
    muted: "#5b6270",
    muted2: "#8a909b",
    success: "#16a34a",
    danger: "#dc2626",
  },
  fonts: {
    display: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  contact: {
    email: "hello@example.com", // TODO
    ownerEmail: "owner@example.com", // TODO: where lead/booking notifications go
    phone: undefined, // TODO
    city: undefined, // TODO
    region: undefined, // TODO
    addressLine: undefined,
    businessHours: undefined,
  },
  invoice: {
    currency: "CAD", // TODO
    allowedCurrencies: ["CAD", "USD"],
    taxRate: 13, // TODO
    dueInDays: 14,
    numberPrefix: "INV-",
    locale: "en-CA", // TODO
  },
  locale: "en-CA", // TODO
  timezone: "America/Toronto", // TODO: IANA tz, e.g. "America/New_York"
  meetingTitle: "Discovery call — ${title}", // TODO
  meetingNoun: "discovery call", // TODO: e.g. "appointment"
});
`;
fs.writeFileSync(path.join(dest, "lib", "brand.ts"), brandStub);

// 3) Leave a scaffold note at the app root.
const note = `# ${title} — scaffolded from apps/${SOURCE_APP}

This app was generated by scripts/create-client.mjs. See docs/create-client.md
for the full setup + provisioning checklist. Quick version:

1. lib/brand.ts        — fill every TODO (name, colors, fonts, contact, invoice, tz).
2. app/globals.css     — set the @theme color tokens to match brand.ts.
3. app/layout.tsx      — swap next/font faces if using custom fonts.
4. lib/site-config.ts  — replace marketing copy / sections for this client.
5. Provision Convex:   npm exec -w ${slug} -- convex dev   (creates a NEW deployment)
6. Set env (per docs): Google OAuth, SMTP, ADMIN_* , CRON_SECRET, EMAIL_LOGO_URL.
   Optional (Omnivo AI): AGENT_API_KEY (API access), OMNIVOAI_API_KEY + OMNIVOAI_WIDGET_URL
   (on-site chat widget). See docs/agent-api.md.
7. Vercel project:     root directory = apps/${slug}.
`;
fs.writeFileSync(path.join(dest, "SCAFFOLD.md"), note);

console.log(`\n✓ Scaffolded apps/${slug} (from apps/${SOURCE_APP}) as "${title}".\n`);
console.log("Next steps:");
console.log("  1. npm install                       # link the new workspace");
console.log(`  2. Edit apps/${slug}/lib/brand.ts     # fill every TODO`);
console.log(`  3. Edit apps/${slug}/app/globals.css  # match @theme tokens to brand`);
console.log(`  4. npm exec -w ${slug} -- convex dev  # provision this client's own Convex`);
console.log(`  5. See apps/${slug}/SCAFFOLD.md and docs/create-client.md for the rest.\n`);
