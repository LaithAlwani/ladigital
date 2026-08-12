import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms governing use of ${siteConfig.company.name}'s website and services.`,
};

const LAST_UPDATED = "May 10, 2026";

export default function TermsPage() {
  return (
    <Container size="md" className="pt-32 pb-24 md:pt-40">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-brand-orange">Legal</p>
      <h1 className="mb-4 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Terms of Use
      </h1>
      <p className="mb-12 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

      <div>
        <Block title="1. Acceptance of Terms">
          <p>
            By accessing or using {siteConfig.seo.siteUrl.replace(/^https?:\/\//, "")} (the
            "Site"), you agree to be bound by these Terms of Use. If you do not agree, do not use
            the Site.
          </p>
        </Block>

        <Block title="2. About LA Digital">
          <p>
            The Site is operated by {siteConfig.company.legalName}, based in{" "}
            {siteConfig.contact.city}, {siteConfig.contact.region}. {siteConfig.company.legalName}{" "}
            is operated under the laws of the Province of Ontario, Canada.
          </p>
        </Block>

        <Block title="3. Use of the Website">
          <p>
            You agree to use the Site only for lawful purposes and in a way that does not infringe
            the rights of, restrict, or inhibit anyone else's use of the Site. Prohibited behaviour
            includes harassment, posting unlawful content, attempting to gain unauthorized access,
            or interfering with the operation of the Site.
          </p>
        </Block>

        <Block title="4. Intellectual Property">
          <p>
            All content on the Site — including text, graphics, logos, icons, images, and code —
            is the property of {siteConfig.company.legalName} or its licensors and is protected by
            Canadian and international copyright laws. You may not reproduce, distribute, or
            create derivative works without our written permission, except where expressly
            permitted (e.g., personal browsing).
          </p>
          <p>
            The "{siteConfig.company.name}" name and logo are trademarks of{" "}
            {siteConfig.company.legalName}.
          </p>
        </Block>

        <Block title="5. Quotes & Proposals">
          <p>
            Prices listed on the Site are starting ranges in Canadian dollars (CAD) and are for
            informational purposes only. Final project pricing is provided in a written proposal
            after a discovery call. A proposal is binding only once both parties sign a separate
            written engagement agreement.
          </p>
        </Block>

        <Block title="6. Pricing & Payment">
          <p>
            All prices are in Canadian dollars (CAD) and are exclusive of applicable taxes,
            including GST/HST. A deposit (typically 50% of the project total) is required to begin
            work, with the balance due on launch or per a milestone schedule specified in the
            engagement agreement. Late payments may be subject to interest as set out in the
            engagement agreement.
          </p>
          <p>
            For ad management services, the management fee covers our services only. Ad spend on
            third-party platforms (e.g., Meta, Google) is billed directly to you by those platforms
            and is not included in our fee.
          </p>
          <p>
            For payment integrations, processor fees (typically 2.9% + $0.30 per transaction) are
            charged by the payment processor (e.g., Stripe) and are not part of our setup fee.
          </p>
        </Block>

        <Block title="7. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, {siteConfig.company.legalName} is not liable
            for any indirect, incidental, special, consequential, or punitive damages, or any loss
            of profits or revenue, whether incurred directly or indirectly, arising from your use
            of the Site or our services. Our total liability for any claim related to a paid
            engagement will not exceed the fees you paid to us for that engagement.
          </p>
        </Block>

        <Block title="8. Third-Party Links">
          <p>
            The Site may contain links to third-party websites. We do not endorse and are not
            responsible for the content, privacy practices, or policies of those sites.
          </p>
        </Block>

        <Block title="9. Disclaimers">
          <p>
            The Site is provided "as is" and "as available" without warranty of any kind, express
            or implied, including warranties of merchantability, fitness for a particular purpose,
            or non-infringement. We do not warrant that the Site will be uninterrupted, error-free,
            or free of harmful components.
          </p>
        </Block>

        <Block title="10. Governing Law">
          <p>
            These Terms are governed by the laws of the Province of Ontario and the federal laws
            of Canada applicable therein. Any dispute will be resolved in the courts located in
            Ontario, Canada.
          </p>
        </Block>

        <Block title="11. Changes to These Terms">
          <p>
            We may update these Terms from time to time. When we do, we will update the "Last
            updated" date above. Continued use of the Site after changes constitutes acceptance of
            the new Terms.
          </p>
        </Block>

        <Block title="12. Contact">
          <p>
            Questions about these Terms? Email us at{" "}
            <a href={`mailto:${siteConfig.contact.email}`} className="text-brand-orange hover:underline">
              {siteConfig.contact.email}
            </a>
            .
          </p>
        </Block>
      </div>
    </Container>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 font-display text-xl font-semibold text-foreground sm:text-2xl">
        {title}
      </h2>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
