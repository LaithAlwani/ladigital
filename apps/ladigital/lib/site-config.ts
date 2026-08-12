import type { SiteConfig } from "./types";

// ----------------------------------------------------------------------------
// LA Digital — Single source of truth.
//
// Subscription-first pricing model:
//   1. Platform Plans (Presence / Growth / Scale) — monthly subscription
//      with a $499 one-time setup fee. Setup is waived with a 12-month
//      annual commitment.
//   2. AI Assistant add-on ($99/mo) — the AI chat plus all AI automations,
//      layered on top of any Platform Plan.
//
// Every price is "Starting at $X". The discovery call sets the final number.
// ----------------------------------------------------------------------------

export const siteConfig: SiteConfig = {
  company: {
    name: "LA Digital",
    legalName: "LA Digital",
    tagline: "Get found. Get booked. Get more customers.",
    description:
      "We get small businesses noticed and booked — a professional website that ranks on Google, turns visitors into paying customers, and takes appointments 24/7. From $49/month.",
    heroHeadline: "Get found. Get booked. Get paid.",
    heroSubheadline:
      "We build your small business a website that gets you noticed on Google, turns visitors into paying customers, and takes bookings around the clock — from $49/month, no big upfront cost.",
    foundedYear: 2024,
    locale: "en-CA",
  },

  contact: {
    email: "support@ladigital.ca",
    phone: "+1 (613) 884-1155",
    city: "Ottawa",
    region: "Ontario, Canada",
    addressLine: "Ottawa, ON, Canada",
    businessHours: "Mon–Fri, 9am–4pm ET",
    // Approximate Ottawa downtown centroid — Google uses this as the
    // anchor point for LocalBusiness map intent. Refine if/when we have
    // a specific street address registered.
    geo: {
      latitude: 45.4215,
      longitude: -75.6972,
      postalCode: "K1P 1J1",
      regionCode: "ON",
      countryCode: "CA",
    },
  },

  pricing: {
    setupFee: 499,
    setupWaivedAnnual: true,
    annualPromoLine: "From $49/month · Hosting & maintenance included · No big upfront cost.",
  },

  socials: [
    { platform: "instagram", url: "https://instagram.com/ladigital", handle: "@ladigital" },
    { platform: "youtube", url: "https://youtube.com/", handle: "@ladigital" },
    { platform: "tiktok", url: "https://tiktok.com/", handle: "@ladigital" },
    { platform: "facebook", url: "https://facebook.com/", handle: "ladigital" },
  ],

  valueProps: [
    {
      iconName: "TrendingUp",
      title: "Get found by more customers",
      description:
        "A fast, mobile-friendly site with the SEO and Google setup that gets you showing up when local customers search — so more of the right people find you.",
    },
    {
      iconName: "Zap",
      title: "Turn visitors into bookings & sales",
      description:
        "A professional design that wins trust, plus built-in booking that lets customers reserve 24/7 — so clicks turn into appointments and paying customers, not bounces.",
    },
    {
      iconName: "Headphones",
      title: "All the upside, none of the hassle",
      description:
        "We build, host, secure, and maintain it — and you can always reach a real person. From $49/month with no big upfront cost, so you just focus on running your business.",
    },
  ],

  services: [
    // ====================================================================
    // 1. PROFESSIONAL WEBSITES — the $49/mo entry offer. Convex-backed
    //    (categoryId "plans"), hosting & maintenance included.
    // ====================================================================
    {
      id: "plans",
      name: "Professional Websites",
      summary:
        "A mobile-friendly website that gets you found on Google and turns visitors into customers — one low monthly price.",
      longDescription:
        "The website is the vehicle; more customers is the point. Custom-designed, mobile-friendly, SEO-ready, hosted, and maintained — built to get you found and get you booked, all for $49/month with no big upfront cost. Need something bigger? We'll quote it.",
      iconName: "Globe",
      image: "/1.jpg",
      featured: true,
      packages: [
        {
          id: "professional-website",
          name: "Website",
          tagline: "Everything a small business needs to get found and win new customers online.",
          price: 49,
          currency: "CAD",
          unit: "per-month",
          features: [
            "Custom, mobile-friendly design",
            "Hosting & maintenance included",
            "SSL security & updates",
            "Contact forms & Google setup",
            "Basic SEO to get you found",
            "Ongoing support",
          ],
          notes: [
            "No large upfront cost. Bigger builds are a simple custom quote.",
          ],
        },
        {
          id: "website-booking",
          name: "Website + Booking",
          tagline: "Your website, plus an online booking system your customers can use 24/7.",
          price: 99,
          currency: "CAD",
          unit: "per-month",
          highlight: true,
          features: [
            "Everything in Website, plus:",
            "Online booking & calendar system",
            "Automated email & SMS reminders",
            "Google Calendar sync",
            "Manage all appointments in one place",
          ],
          notes: [
            "Perfect for appointments — barbers, salons, cleaners, trades, and clinics.",
          ],
        },
      ],
      cta: { label: "See what's included", href: "/#websites" },
    },

    // ====================================================================
    // 2. CUSTOM SOFTWARE & APPS — quote-based (price 0 → "Custom quote").
    // ====================================================================
    {
      id: "custom",
      name: "Custom Software & Apps",
      summary: "Mobile apps, desktop apps, and custom software — built for your business.",
      longDescription:
        "When an off-the-shelf site isn't enough, we build it: iOS/Android apps, Windows/macOS desktop apps, and custom software. Every build is quoted to fit.",
      iconName: "Layers",
      image: "/5.jpg",
      packages: [
        {
          id: "mobile-app",
          name: "Custom Mobile App",
          tagline: "iOS & Android apps for your business.",
          price: 0,
          currency: "CAD",
          features: [
            "iOS & Android",
            "App store deployment",
            "Push notifications",
            "Ongoing maintenance",
          ],
        },
        {
          id: "desktop-app",
          name: "Custom Desktop App",
          tagline: "Windows & macOS apps for your team.",
          price: 0,
          currency: "CAD",
          features: [
            "Windows & macOS",
            "Offline-capable workflows",
            "Deployment support",
            "Ongoing maintenance",
          ],
        },
        {
          id: "custom-software",
          name: "Custom Software",
          tagline: "Bespoke software built around how you work.",
          price: 0,
          currency: "CAD",
          features: [
            "Tailored to your workflow",
            "Integrations with your tools",
            "Scalable & maintained",
            "Built and supported by us",
          ],
        },
      ],
      cta: { label: "Get a custom quote", href: "/book" },
    },
  ],

  process: [
    { number: "01", title: "Tell us about your business", description: "A quick call or form — who your customers are and what you want more of. No jargon, no pressure." },
    { number: "02", title: "We build to get you customers", description: "A custom, mobile-friendly site designed to get you found on Google and turn visitors into bookings." },
    { number: "03", title: "Go live for $49/month", description: "We launch, host, and maintain it — no big upfront bill, and you start getting found." },
    { number: "04", title: "Grow when you're ready", description: "Add booking, custom software, an app, or Omnivo AI as more customers come in." },
  ],

  seo: {
    defaultTitle: "LA Digital — Websites that get small businesses more customers, from $49/mo",
    titleTemplate: "%s | LA Digital",
    defaultDescription:
      "Get found on Google, turn visitors into customers, and take bookings 24/7 with a professional small-business website from $49/month — hosting, maintenance, and SEO included. Ottawa, Canada.",
    ogImage: "/og-default.png",
    siteUrl: "https://ladigital.ca",
    keywords: [
      // Core positioning — affordable websites
      "affordable small business website",
      "$49 website",
      "cheap website alternative",
      "small business web design",
      "mobile-friendly website",
      "website hosting and maintenance",
      "monthly website plan",
      // Local intent (Ottawa / Canada)
      "Ottawa web design",
      "small business website Ottawa",
      "affordable website Canada",
      "web design Canada",
      // Other services
      "small business SEO",
      "custom software development",
      "custom mobile app",
      "custom desktop app",
    ],
  },

  mail: {
    // From/owner addresses for transactional email (sent via Nodemailer/SMTP).
    // These are sensible defaults; the actual From can be overridden per-send
    // and the SMTP transport is configured via SMTP_* env vars (see lib/mailer.ts).
    fromEmail: "LA Digital <support@ladigital.ca>",
    toEmail: "laithalwani@gmail.com",
  },

  // Omnivo AI — separate brand/product (AI automation) on its own domain. The
  // marketing site introduces it and links out; it is never merged into pricing.
  omnivo: {
    name: "Omnivo AI",
    tagline:
      "AI automation for your business — answer customer questions and capture leads 24/7, connected to the booking and reminder tools you already use.",
    url: "https://omnivoai.ca",
  },
};

/** Date the marketing content was last reviewed — an AEO freshness signal
 * emitted in the FAQ schema and shown on the FAQ section. Update when copy
 * or pricing changes. */
export const CONTENT_LAST_UPDATED = "2026-08-12";
