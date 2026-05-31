export type PriceUnit = "one-time" | "per-month" | "per-project";

/** A line item in an "à la carte" style package option list. */
export type ServiceOption = {
  name: string;
  /** Starting price in CAD. */
  price: number;
  unit?: PriceUnit;
};

export type ServicePackage = {
  id: string;
  name: string;
  tagline?: string;
  /** Starting price in CAD. Always rendered as "Starting at $X". */
  price: number;
  currency: "CAD" | "USD";
  /** Unit for `price`. Defaults to "one-time" (setup fee). */
  unit?: PriceUnit;
  /**
   * Optional ongoing monthly fee shown as a secondary line under the main
   * price. Use this when a package has BOTH a one-time price AND a recurring
   * monthly. For pure-subscription packages, set `price` to the monthly value
   * and `unit: "per-month"` instead.
   */
  monthlyPrice?: number;
  /**
   * One-time onboarding/setup fee in CAD. Rendered as a small secondary line
   * under the main monthly price (e.g. "+ $499 setup, waived with annual
   * commitment"). Only used on subscription packages.
   */
  setupFee?: number;
  /** If true, the setup fee is presented as waived with a 12-month commitment. */
  setupWaivedAnnual?: boolean;
  features: string[];
  notes?: string[];
  highlight?: boolean;
  ctaLabel?: string;
  /**
   * Optional list of à-la-carte options rendered as a priced menu inside the
   * card. When present, the card hides the big PriceDisplay and the features
   * list, and shows this menu instead — useful for "pick what you need" cards.
   */
  options?: ServiceOption[];
};

export type ServiceCategory = {
  id: string;
  name: string;
  summary: string;
  longDescription?: string;
  iconName: string;
  image?: string;
  packages: ServicePackage[];
  cta: { label: string; href: string };
  /** show on the home services teaser grid (cap to 6). */
  featured?: boolean;
};

export type ProcessStep = {
  number: string;
  title: string;
  description: string;
};

export type Social = {
  platform: "instagram" | "youtube" | "tiktok" | "facebook";
  url: string;
  handle: string;
};

export type ValueProp = {
  iconName: string;
  title: string;
  description: string;
};

export type SiteConfig = {
  company: {
    name: string;
    legalName: string;
    tagline: string;
    description: string;
    heroHeadline: string;
    heroSubheadline: string;
    foundedYear: number;
    locale: "en-CA";
  };
  contact: {
    email: string;
    phone?: string;
    city: string;
    region: string;
    addressLine?: string;
    businessHours?: string;
    /**
     * Geo + postal data — drives the LocalBusiness JSON-LD that lifts local
     * search visibility. Approximate is fine; Google uses it as a centroid.
     */
    geo?: {
      latitude: number;
      longitude: number;
      postalCode: string;
      regionCode: string; // ISO-3166-2 subdivision, e.g. "ON"
      countryCode: string; // ISO-3166-1 alpha-2, e.g. "CA"
    };
  };
  /**
   * Global pricing knobs that apply across the platform plans. Stored once so
   * marketing copy in the hero, plan cards, and CTAs all stays in sync.
   */
  pricing: {
    /** Standard one-time onboarding fee in CAD (applied to Platform Plans). */
    setupFee: number;
    /** Whether the setup fee is waived with a 12-month commitment. */
    setupWaivedAnnual: boolean;
    /** Short marketing line used in hero / CTAs. */
    annualPromoLine: string;
  };
  socials: Social[];
  valueProps: ValueProp[];
  services: ServiceCategory[];
  process: ProcessStep[];
  seo: {
    defaultTitle: string;
    titleTemplate: string;
    defaultDescription: string;
    ogImage: string;
    siteUrl: string;
    keywords: string[];
  };
  mail: {
    fromEmail: string;
    toEmail: string;
    replyTo?: string;
  };
};
