import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.company.name} collects, uses, and protects your data.`,
};

const LAST_UPDATED = "May 10, 2026";

export default function PrivacyPage() {
  return (
    <Container size="md" className="pt-32 pb-24 md:pt-40">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-brand-orange">
        Legal
      </p>
      <h1 className="mb-4 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Privacy Policy
      </h1>
      <p className="mb-12 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

      <div className="prose-stack">
        <Block title="1. Introduction">
          <p>
            {siteConfig.company.legalName} ("we", "our", or "us") provides web development,
            software, and digital marketing services through{" "}
            <Link href="/" className="text-brand-orange hover:underline">
              {siteConfig.seo.siteUrl.replace(/^https?:\/\//, "")}
            </Link>
            . This Privacy Policy describes how we collect, use, and protect your information when
            you visit our site or contact us. If you have questions, email us at{" "}
            <a href={`mailto:${siteConfig.contact.email}`} className="text-brand-orange hover:underline">
              {siteConfig.contact.email}
            </a>
            .
          </p>
        </Block>

        <Block title="2. Information We Collect">
          <p>We collect only what we need to respond to you and operate the site:</p>
          <ul>
            <li>
              <strong>Contact form submissions:</strong> name, email address, optional phone, optional
              company name, service interest, budget range, and the message you send us.
            </li>
            <li>
              <strong>Server logs:</strong> IP address, browser user agent, request path, and
              timestamp. Used for security and debugging.
            </li>
            <li>
              <strong>Cookies & analytics:</strong> this site does not set non-essential cookies. If
              we add analytics in the future, this section will be updated and a consent banner
              will be shown before any tracking occurs.
            </li>
          </ul>
        </Block>

        <Block title="3. How We Use Your Information">
          <ul>
            <li>To respond to your inquiry and prepare a proposal.</li>
            <li>To send you a confirmation email recapping your submission.</li>
            <li>To follow up about a quote, project, or scheduled engagement.</li>
            <li>To keep records of our business communications.</li>
            <li>To detect and prevent abuse, spam, and fraud.</li>
          </ul>
          <p>We do not sell your information. We do not use your information for advertising.</p>
        </Block>

        <Block title="4. Third-Party Services">
          <p>We rely on a small set of vendors to operate this site:</p>
          <ul>
            <li>
              <strong>Email delivery (SMTP):</strong> when you submit the contact form or book a
              call, your submission is sent through our email provider over SMTP so we can receive a
              notification and send you a confirmation.
            </li>
            <li>
              <strong>Hosting provider:</strong> the site is served from a global CDN/edge network.
              Standard server logs (IP, user agent, timestamps) are processed by our hosting
              provider.
            </li>
          </ul>
        </Block>

        <Block title="5. Data Retention">
          <p>
            Contact-form submissions are retained for up to <strong>24 months</strong> after our
            last communication unless you ask us to delete them sooner. Server logs are retained for
            up to 90 days. Project records related to a paid engagement may be kept longer to comply
            with Canadian tax and accounting requirements.
          </p>
        </Block>

        <Block title="6. Your Rights">
          <p>
            <strong>Canada (PIPEDA):</strong> you have the right to access the personal information
            we hold about you, correct inaccuracies, and withdraw consent for future use. To
            exercise these rights, email{" "}
            <a href={`mailto:${siteConfig.contact.email}`} className="text-brand-orange hover:underline">
              {siteConfig.contact.email}
            </a>
            .
          </p>
          <p>
            <strong>EU / UK (GDPR):</strong> if you are in the EU or UK, you also have the right to
            data portability and erasure ("right to be forgotten"). You may lodge a complaint with
            your local supervisory authority.
          </p>
        </Block>

        <Block title="7. Data Storage & Cross-Border Transfers">
          <p>
            Our hosting and email vendors may store data on servers located outside of Canada,
            including in the United States. By using this site or contacting us, you acknowledge
            that your information may be transferred to and stored in those jurisdictions, subject
            to their respective data-protection laws.
          </p>
        </Block>

        <Block title="8. Security">
          <p>
            All traffic to this site is encrypted in transit using TLS. We do not store credit-card
            information. Access to inquiry data is restricted to {siteConfig.company.legalName}{" "}
            staff. We take reasonable measures to protect your information but cannot guarantee
            absolute security.
          </p>
        </Block>

        <Block title="9. Children's Privacy">
          <p>
            This site is not directed at children under 13. We do not knowingly collect personal
            information from children. If we learn that we have collected information from a child,
            we will delete it promptly.
          </p>
        </Block>

        <Block title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. When we do, we will update the
            "Last updated" date above. Material changes will be highlighted on this page.
          </p>
        </Block>

        <Block title="11. Contact Us">
          <p>
            For any privacy-related questions or requests, contact us at:
            <br />
            <a href={`mailto:${siteConfig.contact.email}`} className="text-brand-orange hover:underline">
              {siteConfig.contact.email}
            </a>
            <br />
            {siteConfig.company.legalName}
            <br />
            {siteConfig.contact.addressLine}
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
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted [&_a]:underline-offset-2 [&_li]:marker:text-brand-orange [&_strong]:text-foreground [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}
