import { siteConfig } from "./site-config";
import type { ServicePackage } from "./types";

// ----------------------------------------------------------------------------
// JSON-LD builders. Every function returns a plain object; the <JsonLd>
// component serializes it. Schemas reference one another by `@id` so Google
// can correlate Organization → LocalBusiness → Service / Offer cleanly.
// ----------------------------------------------------------------------------

const baseUrl = () => siteConfig.seo.siteUrl.replace(/\/$/, "");

const ORG_ID = "#organization";
const LOCAL_BUSINESS_ID = "#local-business";
const WEBSITE_ID = "#website";

export function abs(path: string): string {
  if (path.startsWith("http")) return path;
  return `${baseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function organizationLd() {
  const c = siteConfig.company;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl()}/${ORG_ID}`,
    name: c.legalName,
    alternateName: c.name,
    description: c.description,
    url: baseUrl(),
    logo: abs("/logo_300dpi.png"),
    image: abs(siteConfig.seo.ogImage),
    email: siteConfig.contact.email,
    ...(siteConfig.contact.phone ? { telephone: siteConfig.contact.phone } : {}),
    foundingDate: `${c.foundedYear}`,
    sameAs: siteConfig.socials.map((s) => s.url),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: siteConfig.contact.email,
      ...(siteConfig.contact.phone
        ? { telephone: siteConfig.contact.phone }
        : {}),
      availableLanguage: ["en", "fr"],
      areaServed: "CA",
    },
  };
}

export function localBusinessLd() {
  const c = siteConfig.company;
  const contact = siteConfig.contact;
  const geo = contact.geo;

  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${baseUrl()}/${LOCAL_BUSINESS_ID}`,
    name: c.legalName,
    description: c.description,
    url: baseUrl(),
    image: abs(siteConfig.seo.ogImage),
    logo: abs("/logo_300dpi.png"),
    email: contact.email,
    ...(contact.phone ? { telephone: contact.phone } : {}),
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: contact.city,
      addressRegion: geo?.regionCode ?? "ON",
      postalCode: geo?.postalCode,
      addressCountry: geo?.countryCode ?? "CA",
    },
    ...(geo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: geo.latitude,
            longitude: geo.longitude,
          },
        }
      : {}),
    areaServed: [
      { "@type": "City", name: "Ottawa" },
      { "@type": "AdministrativeArea", name: "Ontario" },
      { "@type": "Country", name: "Canada" },
    ],
    ...(contact.businessHours
      ? { openingHours: "Mo-Fr 09:00-16:00" }
      : {}),
    sameAs: siteConfig.socials.map((s) => s.url),
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl()}/${WEBSITE_ID}`,
    name: siteConfig.company.name,
    url: baseUrl(),
    inLanguage: siteConfig.company.locale,
    publisher: { "@id": `${baseUrl()}/${ORG_ID}` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl()}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * One Service object per Platform Plan. Includes an Offer with the monthly
 * subscription price; setup is documented in `description` rather than as a
 * separate Offer so Google doesn't show two prices.
 */
export function serviceLd(pkg: ServicePackage, path: string) {
  const setupNote =
    pkg.setupFee && pkg.setupWaivedAnnual
      ? ` Standard $${pkg.setupFee} setup fee waived with a 12-month commitment.`
      : pkg.setupFee
        ? ` One-time setup fee: $${pkg.setupFee}.`
        : "";

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${pkg.name} — ${siteConfig.company.name}`,
    description: `${pkg.tagline ?? ""}${setupNote}`.trim(),
    serviceType: pkg.name,
    provider: { "@id": `${baseUrl()}/${LOCAL_BUSINESS_ID}` },
    areaServed: { "@type": "Country", name: "Canada" },
    url: abs(path),
    offers: {
      "@type": "Offer",
      price: pkg.price.toFixed(2),
      priceCurrency: pkg.currency,
      url: abs(path),
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: pkg.price.toFixed(2),
        priceCurrency: pkg.currency,
        unitCode: "MON",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${pkg.name} features`,
      itemListElement: pkg.features.map((f, i) => ({
        "@type": "Offer",
        position: i + 1,
        itemOffered: { "@type": "Service", name: f },
      })),
    },
  };
}

type Crumb = { name: string; path: string };
export function breadcrumbLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

export function faqPageLd(
  items: Array<{ question: string; answer: string }>,
  updated?: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    // Freshness signals help AI answer engines (ChatGPT/Claude/Gemini) trust and
    // cite the content — most AI citations come from recently-updated pages.
    ...(updated ? { datePublished: updated, dateModified: updated } : {}),
    mainEntity: items.map((qa) => ({
      "@type": "Question",
      name: qa.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: qa.answer,
      },
    })),
  };
}
