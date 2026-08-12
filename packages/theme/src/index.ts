// @ladigital/theme — the single per-site brand/theme source.
//
// One `BrandConfig` per app drives every surface. The web UI re-themes through
// the Tailwind v4 `@theme` block + next/font (authored per app in globals.css /
// layout.tsx). The surfaces that CANNOT read CSS variables — HTML emails and
// jsPDF invoices — derive their palettes from this same config here, so they
// never drift from the site (they used to be frozen by hand).

export type Rgb = [number, number, number];

/** Solid hex brand palette (shared by emails + PDFs; mirrors the web `@theme`). */
export type BrandColors = {
  brand: string;
  brandSoft: string;
  brandDeep: string;
  ink: string; // page/background
  surface: string; // cards
  surface2: string; // subtle fills
  border: string; // solid border (for email/PDF)
  foreground: string; // primary text
  muted: string;
  muted2: string;
  success: string;
  danger: string;
};

/** CSS font-family stacks used by email/PDF fallbacks (web uses next/font). */
export type BrandFonts = {
  display: string;
  body: string;
  mono: string;
};

export type BrandIdentity = {
  name: string;
  legalName: string;
  tagline?: string;
  /** Public HTTPS logo for emails/PDF. Falls back to the initials badge in email. */
  logoUrl?: string;
  wordmarkInitials?: string;
};

export type BrandContact = {
  email: string;
  ownerEmail?: string;
  phone?: string;
  city?: string;
  region?: string;
  addressLine?: string;
  businessHours?: string;
};

export type InvoiceDefaults = {
  currency: string;
  allowedCurrencies: string[];
  taxRate: number;
  dueInDays: number;
  numberPrefix: string;
  locale: string;
};

export type BrandConfig = {
  identity: BrandIdentity;
  colors: BrandColors;
  fonts: BrandFonts;
  contact: BrandContact;
  invoice: InvoiceDefaults;
  locale: string;
  timezone: string;
  /** Booking meeting summary, e.g. "Discovery call — Acme". */
  meetingTitle: string;
  /** Noun used in copy, e.g. "discovery call" or "appointment". */
  meetingNoun: string;
};

/** Identity helper (place for future validation/defaults). */
export function defineBrand(config: BrandConfig): BrandConfig {
  return config;
}

// --- Email palette (self-contained; email clients can't use CSS vars) --------
export type EmailPalette = {
  brand: string;
  brandSoft: string;
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  fg: string;
  muted: string;
  muted2: string;
};

export function emailPalette(c: BrandColors): EmailPalette {
  return {
    brand: c.brand,
    brandSoft: c.brandSoft,
    bg: c.ink,
    surface: c.surface,
    surface2: c.surface2,
    border: c.border,
    fg: c.foreground,
    muted: c.muted,
    muted2: c.muted2,
  };
}

/** System-safe stack for email (real webfonts don't load in most clients). */
export const EMAIL_FONT_STACK_DEFAULT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export function emailFontStack(fonts?: BrandFonts): string {
  return fonts?.body?.trim() || EMAIL_FONT_STACK_DEFAULT;
}

// --- PDF palette (jsPDF needs RGB tuples) ------------------------------------
export function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const n = parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export type PdfPalette = { accent: Rgb; ink: Rgb; muted: Rgb };

export function pdfPalette(c: BrandColors): PdfPalette {
  return { accent: hexToRgb(c.brand), ink: hexToRgb(c.foreground), muted: hexToRgb(c.muted) };
}
