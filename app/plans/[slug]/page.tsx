import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/ui/price-display";
import { CtaBanner } from "@/components/sections/cta-banner";
import { JsonLd } from "@/components/seo/json-ld";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { breadcrumbLd, serviceLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import type { ServicePackage } from "@/lib/types";

export const dynamic = "force-dynamic";

// Per-plan SEO copy. Keep titles ≤ 60 chars, descriptions 150–160 chars.
type PlanSeo = {
  title: string;
  description: string;
  h1: string;
  intro: string;
  keywordHint: string;
};

const PLAN_SEO: Record<string, PlanSeo> = {
  presence: {
    title: "Presence — Managed business website with hosting & support",
    description:
      "A professional mobile-first website with hosting, security, support, and basic SEO — all bundled into a $199/mo subscription. $0 setup with annual commitment.",
    h1: "A managed business website, sold as a subscription.",
    intro:
      "Presence is for businesses that need a professional online presence without managing a developer, a host, and a security audit themselves. One predictable monthly bill — your website stays fast, secure, and up to date.",
    keywordHint: "managed business website · Ottawa · subscription website",
  },
  growth: {
    title: "Growth — Online booking, accounts, and payments on a monthly plan",
    description:
      "Turn your website into a business operating system. Customer accounts, online booking, payments, dashboard, and automated reminders — $399/mo. Setup waived annually.",
    h1: "Your website, working as your business operating system.",
    intro:
      "Growth is for businesses that take bookings, process payments, or manage customers online. You get everything in Presence, plus authentication, an online booking system, payments, a customer dashboard, and automated email/SMS reminders.",
    keywordHint: "online booking system · customer dashboard · small business CRM Canada",
  },
  scale: {
    title: "Scale — Business automation, AI assistant, and CRM platform",
    description:
      "Admin dashboards, an AI assistant, CRM workflows, business automation, and marketing infrastructure on one monthly subscription. From $799/mo. $0 setup with annual.",
    h1: "Automation and operational systems built to help your business scale.",
    intro:
      "Scale is for businesses serious about operational efficiency. You get an admin dashboard, AI assistant, CRM, business reporting, workflow automations, and marketing infrastructure (tracking, conversion, landing pages) — leaving you free to focus on growth.",
    keywordHint: "business automation · AI assistant for SMB · CRM small business Canada",
  },
};

function findStaticPlan(slug: string): ServicePackage | undefined {
  return siteConfig.services
    .find((s) => s.id === "plans")
    ?.packages.find((p) => p.id === slug);
}

/** Effective plan: admin-edited (Convex) if present, else the static package. */
async function findPlan(slug: string): Promise<ServicePackage | undefined> {
  const rows = await fetchQuery(api.plans.getPublic, {}).catch(() => []);
  const row = rows.find((r) => r.categoryId === "plans" && r.slug === slug);
  if (row) {
    return {
      id: row.slug,
      name: row.name,
      tagline: row.tagline,
      price: row.price,
      currency: "CAD",
      unit: row.unit,
      setupFee: row.setupFee,
      setupWaivedAnnual: row.setupWaivedAnnual,
      features: row.features,
      notes: row.notes,
      highlight: row.highlight,
    };
  }
  return findStaticPlan(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const seo = PLAN_SEO[slug];
  if (!seo) return {};
  const ogImage = `/og-${slug}.png`;
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/plans/${slug}` },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `/plans/${slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: seo.h1,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [ogImage],
    },
  };
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pkg = await findPlan(slug);
  const seo = PLAN_SEO[slug];
  if (!pkg || !seo) notFound();

  const crumbs = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Plans & Pricing", path: "/services" },
    { name: pkg.name, path: `/plans/${slug}` },
  ]);

  const planHref = `/#contact?service=plans&package=${encodeURIComponent(slug)}`;

  return (
    <>
      <JsonLd data={[serviceLd(pkg, `/plans/${slug}`), crumbs]} />

      <Section padding="lg" className="pt-32 md:pt-40">
        <Container>
          <div className="mx-auto max-w-4xl">
            {/* Breadcrumb trail — visible match for the JSON-LD */}
            <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-2">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-foreground">
                    Home
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link href="/services" className="hover:text-foreground">
                    Plans
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="text-foreground">{pkg.name}</li>
              </ol>
            </nav>

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={pkg.highlight ? "orange" : "default"}>
                {pkg.name} plan
              </Badge>
              {pkg.highlight ? (
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-brand-orange">
                  Most popular
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl">
              {seo.h1}
            </h1>

            <p className="mt-5 max-w-2xl text-base text-muted sm:text-lg">
              {seo.intro}
            </p>

            <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
              {/* Features */}
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {pkg.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 rounded-card border border-border bg-surface/40 p-3.5 text-sm text-foreground"
                  >
                    <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-brand-orange/15 text-brand-orange ring-1 ring-brand-orange/30">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              {/* Pricing card */}
              <aside className="rounded-card border border-brand-orange/40 bg-surface p-6 shadow-glow-soft">
                <PriceDisplay
                  price={pkg.price}
                  unit={pkg.unit}
                  setupFee={pkg.setupFee}
                  setupWaivedAnnual={pkg.setupWaivedAnnual}
                  emphasis="lg"
                />
                <div className="mt-5 flex flex-col gap-3">
                  <Button href={planHref} variant="primary" size="md" fullWidth>
                    Start this plan
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button href="/services" variant="outline" size="md" fullWidth>
                    Compare all plans
                  </Button>
                </div>
                {pkg.notes && pkg.notes.length > 0 ? (
                  <ul className="mt-5 space-y-1.5 text-xs text-muted-2">
                    {pkg.notes.map((n) => (
                      <li key={n}>• {n}</li>
                    ))}
                  </ul>
                ) : null}
              </aside>
            </div>

            <p className="mt-12 text-xs uppercase tracking-[0.18em] text-muted-2">
              {seo.keywordHint}
            </p>
          </div>
        </Container>
      </Section>

      <CtaBanner
        title={`Ready to launch on ${pkg.name}?`}
        description="Book a short discovery call. We'll confirm fit, walk you through the setup, and get your platform live within weeks."
        ctaLabel="Book a discovery call"
      />
    </>
  );
}
