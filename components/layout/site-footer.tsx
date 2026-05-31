import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { FooterSocials } from "@/components/layout/footer-socials";
import { siteConfig } from "@/lib/site-config";

const SITEMAP = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/#process", label: "Process" },
  { href: "/#contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-24 border-t border-border bg-ink-2">
      <Container className="py-14">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="flex flex-col gap-5">
            <Logo size="md" />
            <p className="max-w-sm text-sm text-muted">
              {siteConfig.company.description} Built and supported from {siteConfig.contact.city}.
            </p>
            <FooterSocials size="md" />
          </div>

          <div>
            <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-2">
              Sitemap
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              {SITEMAP.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-foreground/90 transition-colors hover:text-brand-orange">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-2">
              Contact
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="inline-flex items-center gap-2 text-foreground/90 transition-colors hover:text-brand-orange"
                >
                  <Mail className="h-4 w-4 text-muted" />
                  {siteConfig.contact.email}
                </a>
              </li>
              {siteConfig.contact.phone ? (
                <li>
                  <a
                    href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 text-foreground/90 transition-colors hover:text-brand-orange"
                  >
                    <Phone className="h-4 w-4 text-muted" />
                    {siteConfig.contact.phone}
                  </a>
                </li>
              ) : null}
              <li className="inline-flex items-center gap-2 text-muted">
                <MapPin className="h-4 w-4 text-muted-2" />
                {siteConfig.contact.city}, {siteConfig.contact.region}
              </li>
              {siteConfig.contact.businessHours ? (
                <li className="pt-1 text-xs text-muted-2">{siteConfig.contact.businessHours}</li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-2 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {siteConfig.company.legalName}. All rights reserved.
          </span>
          <span>Built in {siteConfig.contact.city}, {siteConfig.contact.region}.</span>
        </div>
      </Container>
    </footer>
  );
}
