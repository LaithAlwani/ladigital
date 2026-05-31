import type { SiteConfig } from "./types";

// ----------------------------------------------------------------------------
// LA Digital — Single source of truth.
//
// Subscription-first pricing model:
//   1. Platform Plans (Presence / Growth / Scale) — monthly subscription
//      with a $499 one-time setup fee. Setup is waived with a 12-month
//      annual commitment.
//   2. Growth Services (SEO / Social Media / Paid Advertising) — monthly,
//      sold separately from the platform.
//   3. Platform Add-ons (Mobile App / Desktop App / AI Assistant /
//      Business Automation / Integrations) — monthly upgrades layered on
//      top of any Platform Plan.
//
// Every price is "Starting at $X". The discovery call sets the final number.
// ----------------------------------------------------------------------------

export const siteConfig: SiteConfig = {
  company: {
    name: "LA Digital",
    legalName: "LA Digital",
    tagline: "Business platform & growth partner",
    description:
      "A business operating system for ambitious companies — websites, automation, and growth services on a simple monthly subscription.",
    heroHeadline: "Your business, powered by one platform.",
    heroSubheadline:
      "Websites, automation, customer management, and growth — bundled into a simple monthly subscription. $0 setup with an annual commitment.",
    foundedYear: 2024,
    locale: "en-CA",
  },

  contact: {
    email: "info@ladigital.ca",
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
    annualPromoLine: "$0 setup fee with annual commitment.",
  },

  socials: [
    { platform: "instagram", url: "https://instagram.com/ladigital", handle: "@ladigital" },
    { platform: "youtube", url: "https://youtube.com/", handle: "@ladigital" },
    { platform: "tiktok", url: "https://tiktok.com/", handle: "@ladigital" },
    { platform: "facebook", url: "https://facebook.com/", handle: "ladigital" },
  ],

  valueProps: [
    {
      iconName: "BadgeDollarSign",
      title: "Subscription, not a project quote",
      description:
        "One predictable monthly bill that covers your platform, hosting, maintenance, and ongoing support — no surprise invoices, no scope creep.",
    },
    {
      iconName: "Zap",
      title: "$0 setup with annual commitment",
      description:
        "Skip the standard $499 onboarding fee when you sign on for 12 months. Your platform is ready to launch within weeks, not quarters.",
    },
    {
      iconName: "Headphones",
      title: "A long-term growth partner",
      description:
        "We don't disappear after launch. Every plan includes ongoing updates, security, support, and a team that knows your business.",
    },
  ],

  services: [
    // ====================================================================
    // 1. PLATFORM PLANS — Presence / Growth / Scale.
    //    Monthly subscription + one-time $499 setup (waived with annual).
    // ====================================================================
    {
      id: "plans",
      name: "Platform Plans",
      summary:
        "Three plans that grow with you — from a polished online presence to a fully automated operating system.",
      longDescription:
        "Every plan includes hosting, maintenance, security, and support — all rolled into one simple monthly subscription. Upgrade anytime as your business grows. The standard $499 setup is waived with a 12-month commitment.",
      iconName: "Layers",
      image: "/1.jpg",
      featured: true,
      packages: [
        {
          id: "presence",
          name: "Presence",
          tagline: "Everything your business needs to look professional online.",
          price: 199,
          currency: "CAD",
          unit: "per-month",
          setupFee: 499,
          setupWaivedAnnual: true,
          features: [
            "Mobile-first website or app",
            "Hosting, security, and updates",
            "Contact forms with notifications",
            "Basic SEO and Google setup",
            "Analytics dashboard",
            "Social media links",
            "Minor monthly edits",
            "Ongoing support",
          ],
          notes: [
            "Ideal for businesses that need a professional online presence.",
          ],
        },
        {
          id: "growth",
          name: "Growth",
          tagline: "Turn your website into a business operating system.",
          price: 399,
          currency: "CAD",
          unit: "per-month",
          setupFee: 499,
          setupWaivedAnnual: true,
          highlight: true,
          features: [
            "Everything in Presence, plus:",
            "Customer accounts & logins",
            "Online booking system",
            "Payment processing",
            "Customer dashboard",
            "Automated email notifications",
            "SMS reminders",
            "SEO optimization",
            "Advanced analytics",
          ],
          notes: [
            "Ideal for businesses that take bookings, payments, or manage customers online.",
          ],
        },
        {
          id: "scale",
          name: "Scale",
          tagline: "Automation and operational systems built to help your business scale.",
          price: 799,
          currency: "CAD",
          unit: "per-month",
          setupFee: 499,
          setupWaivedAnnual: true,
          features: [
            "Everything in Growth, plus:",
            "Admin dashboard",
            "AI assistant integration",
            "CRM functionality",
            "Business reporting dashboards",
            "Workflow automations",
            "Third-party integrations",
            "Marketing infrastructure setup",
            "Conversion tracking",
            "Meta Pixel & Google Analytics",
            "Landing page systems",
          ],
          notes: [
            "Includes marketing infrastructure and tracking — not active ad management, SEO, or social media (those are Growth Services).",
          ],
        },
      ],
      cta: { label: "Compare platform plans", href: "/services#plans" },
    },

    // ====================================================================
    // 2. GROWTH SERVICES — SEO / Social / Paid Ads.
    //    Monthly. Sold separately from the platform plans.
    // ====================================================================
    {
      id: "growth-services",
      name: "Growth Services",
      summary:
        "Active marketing services that bring customers to your platform — SEO, social media, and paid advertising.",
      longDescription:
        "Once your platform is live, growth services drive the traffic, audience, and conversions that turn it into revenue. Each one is a separate monthly retainer — pick the ones that fit your stage.",
      iconName: "TrendingUp",
      image: "/3.jpg",
      featured: true,
      packages: [
        {
          id: "seo",
          name: "SEO",
          tagline: "Get found by the customers already searching for you.",
          price: 500,
          currency: "CAD",
          unit: "per-month",
          features: [
            "On-page SEO",
            "Technical SEO",
            "Google Business optimization",
            "Keyword tracking",
            "Monthly SEO reporting",
            "Continuous optimization",
          ],
        },
        {
          id: "social-media",
          name: "Social Media",
          tagline: "Show up, stay consistent, and grow an audience that converts.",
          price: 600,
          currency: "CAD",
          unit: "per-month",
          features: [
            "Content creation",
            "Reels and short-form video",
            "Captions and hashtags",
            "Scheduling and posting",
            "Brand consistency",
            "Engagement assistance",
          ],
        },
        {
          id: "paid-ads",
          name: "Paid Advertising",
          tagline: "Active Meta and Google ad management — built to drive leads.",
          price: 800,
          currency: "CAD",
          unit: "per-month",
          features: [
            "Meta ads management",
            "Google ads management",
            "Campaign setup",
            "Audience targeting",
            "Ad copywriting",
            "Ongoing optimization",
            "Conversion tracking reviews",
            "Monthly reporting",
          ],
          notes: [
            "Ad spend (Meta / Google) paid separately by the client.",
          ],
        },
      ],
      cta: { label: "Explore growth services", href: "/services#growth-services" },
    },

    // ====================================================================
    // 3. PLATFORM ADD-ONS — Mobile / Desktop / AI / Automation / Integrations.
    //    Monthly upgrades stacked on top of any Platform Plan.
    // ====================================================================
    {
      id: "addons",
      name: "Platform Add-ons",
      summary:
        "Optional upgrades that extend your platform — mobile apps, AI, automation, and integrations.",
      longDescription:
        "Start with the plan that fits today, then layer on add-ons when you need them. Every add-on is a monthly subscription that includes deployment, maintenance, and updates.",
      iconName: "Plus",
      image: "/5.jpg",
      featured: true,
      packages: [
        {
          id: "mobile-app",
          name: "Mobile App",
          tagline: "Turn your platform into an iOS and Android app.",
          price: 199,
          currency: "CAD",
          unit: "per-month",
          features: [
            "iOS and Android app",
            "App store deployment",
            "Push notifications",
            "Ongoing maintenance",
            "Same login as your platform",
          ],
        },
        {
          id: "desktop-app",
          name: "Desktop App",
          tagline: "Windows and macOS — ideal for in-house staff and offline workflows.",
          price: 299,
          currency: "CAD",
          unit: "per-month",
          features: [
            "Windows and macOS app",
            "Offline-capable workflows",
            "Deployment support",
            "Ongoing maintenance",
            "Great for salons, clinics, and offices",
          ],
        },
        {
          id: "ai-assistant",
          name: "AI Assistant",
          tagline: "A custom AI chat that answers questions and captures leads.",
          price: 149,
          currency: "CAD",
          unit: "per-month",
          features: [
            "AI chat assistant",
            "FAQ automation",
            "Lead capture assistance",
            "Customer support workflows",
            "Trained on your business",
          ],
        },
        {
          id: "automation",
          name: "Business Automation",
          tagline: "Reduce repetitive work and automate customer communication.",
          price: 249,
          currency: "CAD",
          unit: "per-month",
          features: [
            "Automated appointment reminders",
            "Missed-appointment follow-ups",
            "CRM workflows",
            "Customer re-engagement",
            "Automated review requests",
            "Email and SMS workflows",
            "Staff notifications",
            "AI-assisted responses",
          ],
        },
        {
          id: "integrations",
          name: "Additional Integrations",
          tagline: "Connect the tools you already use.",
          price: 99,
          currency: "CAD",
          unit: "per-month",
          features: [
            "Stripe",
            "QuickBooks",
            "Calendar systems",
            "CRM systems",
            "Third-party APIs",
          ],
          notes: [
            "Pricing is per integration — quoted on the discovery call.",
          ],
        },
      ],
      cta: { label: "Browse add-ons", href: "/services#addons" },
    },
  ],

  process: [
    { number: "01", title: "Discovery", description: "A short call to understand your business, audience, and goals." },
    { number: "02", title: "Setup", description: "Onboarding, branding configuration, and domain & DNS setup." },
    { number: "03", title: "Design", description: "Wireframes and a clickable preview for your feedback." },
    { number: "04", title: "Build", description: "Platform configuration with weekly check-ins and live previews." },
    { number: "05", title: "Launch", description: "Deployment, analytics, and your platform goes live." },
    { number: "06", title: "Ongoing Support", description: "Your subscription kicks in — updates, support, and growth, every month." },
  ],

  seo: {
    defaultTitle: "LA Digital — The business platform for ambitious companies",
    titleTemplate: "%s | LA Digital",
    defaultDescription:
      "LA Digital is a subscription-based business platform — websites, automation, customer management, and growth services on a simple monthly plan. $0 setup with an annual commitment.",
    ogImage: "/og-default.png",
    siteUrl: "https://ladigital.ca",
    keywords: [
      // Core positioning
      "business platform",
      "subscription website",
      "managed website service",
      "business operating system",
      "small business operating system",
      // Local intent (Ottawa / Canada)
      "Ottawa business platform",
      "Ottawa web design",
      "managed website Ottawa",
      "small business website Ottawa",
      "subscription website Canada",
      "monthly website Canada",
      // Capabilities the plans cover
      "online booking system",
      "customer management platform",
      "business automation",
      "AI chatbot small business",
      "AI assistant for SMB",
      "CRM small business Canada",
      // Growth services
      "SEO Ottawa",
      "social media management Ottawa",
      "Google Ads management Ottawa",
      "Meta Ads management Canada",
      "marketing automation Canada",
    ],
  },

  mail: {
    // From/owner addresses for transactional email (sent via Nodemailer/SMTP).
    // These are sensible defaults; the actual From can be overridden per-send
    // and the SMTP transport is configured via SMTP_* env vars (see lib/mailer.ts).
    fromEmail: "LA Digital <info@ladigital.ca>",
    toEmail: "laithalwani@gmail.com",
  },
};

/** Categories shown on the home "Services" teaser grid. */
export const featuredServices = siteConfig.services.filter((s) => s.featured);
