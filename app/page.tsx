import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { ServicesTeaser } from "@/components/sections/services-teaser";
import { WhyChooseUs } from "@/components/sections/why-choose-us";
import { SelectedWork } from "@/components/sections/selected-work";
import { Process } from "@/components/sections/process";
import { ContactSection } from "@/components/sections/contact-section";
import { Faq } from "@/components/sections/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { websiteLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Business platform & growth partner — Ottawa, Canada",
  description:
    "LA Digital is a subscription business platform: websites, online booking, automation, AI, and growth services on one simple monthly plan. $0 setup with annual commitment.",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${siteConfig.company.name} — Business platform & growth partner`,
    description:
      "Websites, automation, customer management, and growth services on a simple monthly subscription. Ottawa-based, serving Canada.",
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

  return (
    <>
      <JsonLd data={websiteLd()} />
      <Hero />
      <ServicesTeaser />
      <WhyChooseUs />
      <SelectedWork />
      <Process />
      <Faq />
      <ContactSection defaultService={serviceMatch?.id} defaultPackage={pkgMatch?.name} />
    </>
  );
}
