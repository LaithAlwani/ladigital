import { defineBrand } from "@ladigital/theme";
import { siteConfig } from "./site-config";

// LA Digital's brand/theme config. This is the ONE per-site source the email
// templates and invoice PDF derive their palettes + identity from (the web UI
// re-themes via app/globals.css `@theme` + next/font). Colors here are solid
// hex mirrors of the light `@theme` tokens (email/PDF can't read CSS vars; the
// `border` token is rgba on the web, so we use a solid light gray here).
export const brand = defineBrand({
  identity: {
    name: siteConfig.company.name,
    legalName: siteConfig.company.legalName,
    tagline: "Web · Apps · AI",
    logoUrl: process.env.EMAIL_LOGO_URL?.trim() || undefined,
    wordmarkInitials: "LA",
  },
  colors: {
    brand: "#ff6a00",
    brandSoft: "#ff8a3d",
    brandDeep: "#d95800",
    ink: "#fafaf9",
    surface: "#ffffff",
    surface2: "#f1f2f0",
    border: "#e6e7e4",
    foreground: "#14181f",
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
    email: siteConfig.contact.email,
    ownerEmail: siteConfig.mail.toEmail,
    phone: siteConfig.contact.phone,
    city: siteConfig.contact.city,
    region: siteConfig.contact.region,
    addressLine: siteConfig.contact.addressLine,
    businessHours: siteConfig.contact.businessHours,
  },
  invoice: {
    currency: "CAD",
    allowedCurrencies: ["CAD", "USD"],
    taxRate: 13,
    dueInDays: 14,
    numberPrefix: "INV-",
    locale: "en-CA",
  },
  locale: "en-CA",
  timezone: "America/Toronto",
  meetingTitle: "Discovery call — LA Digital",
  meetingNoun: "discovery call",
});
