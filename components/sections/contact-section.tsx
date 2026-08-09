import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { ContactForm } from "@/components/forms/contact-form";
import { ContactDetails } from "@/components/sections/contact-details";

type Props = {
  defaultService?: string;
  defaultPackage?: string;
};

export function ContactSection({ defaultService, defaultPackage }: Props) {
  return (
    <Section id="contact" className="scroll-mt-24">
      <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <SectionHeading
            eyebrow="Get started"
            title="Let's get your business online."
            description="Tell us a little about your business. We'll get your $49 website going — and point you to the right SEO or custom work as you grow. We reply within one business day."
          />

          <ContactDetails />

          {/* <div className="mt-8 flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Follow</span>
            <SocialIcons socials={siteConfig.socials} size="sm" />
          </div> */}
        </Reveal>

        <Reveal delay={0.1}>
          <ContactForm defaultService={defaultService} defaultPackage={defaultPackage} />
        </Reveal>
      </div>
    </Section>
  );
}
