import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { WebsiteOffer } from "@/components/sections/website-offer";
import { MoreServices } from "@/components/sections/more-services";
import { OmnivoCta } from "@/components/sections/omnivo-cta";
import { WhyChooseUs } from "@/components/sections/why-choose-us";
import { SelectedWork } from "@/components/sections/selected-work";
import { Process } from "@/components/sections/process";
import { ContactSection } from "@/components/sections/contact-section";
import { Faq } from "@/components/sections/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { websiteLd, faqPageLd, serviceLd } from "@/lib/seo";
import { faqItems } from "@/lib/faq";
import { siteConfig, CONTENT_LAST_UPDATED } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Affordable professional websites from $49/month — Ottawa, Canada",
  description:
    "Professional, mobile-friendly websites for small businesses from $49/month — hosting, maintenance, and basic SEO included. Plus custom apps and software.",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${siteConfig.company.name} — Professional websites without the agency price tag`,
    description:
      "A real, mobile-friendly website designed, hosted, and maintained for $49/month. Plus custom software and apps as you grow.",
    url: "/",
    images: [siteConfig.seo.ogImage],
  },
};

type Props = {
  searchParams?: Promise<{ service?: string; package?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const serviceMatch =
    sp.service ? siteConfig.services.find((s) => s.id === sp.service) : undefined;
  const pkgMatch =
    sp.package && serviceMatch ? serviceMatch.packages.find((p) => p.id === sp.package) : undefined;

  // Service schema for the $49 website + FAQ schema live on the home page.
  const websites = siteConfig.services.find((s) => s.id === "plans");
  const websiteSchemas = (websites?.packages ?? []).map((pkg) => serviceLd(pkg, "/#websites"));

  return (
    <>
      <JsonLd data={[websiteLd(), ...websiteSchemas, faqPageLd(faqItems, CONTENT_LAST_UPDATED)]} />
      <Hero />
      <WebsiteOffer />
      <MoreServices />
      <OmnivoCta />
      <SelectedWork />
      <WhyChooseUs />
      <Process />
      <Faq />
      <ContactSection defaultService={serviceMatch?.id} defaultPackage={pkgMatch?.name} />
    </>
  );
}
