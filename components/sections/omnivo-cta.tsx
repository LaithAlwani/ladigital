import { ArrowUpRight } from "lucide-react";
import { Section } from "@/components/ui/section";
import { siteConfig } from "@/lib/site-config";

// "Want your website to do more?" — introduces Omnivo AI as a SEPARATE brand and
// links out to its own site. Deliberately styled apart from LA Digital's orange
// CTAs (dark button) so it reads as a distinct product, not a bundled add-on.
export function OmnivoCta() {
  const { name, tagline, url } = siteConfig.omnivo;

  return (
    <Section id="omnivo" padding="sm">
      <div className="relative overflow-hidden rounded-card border border-border bg-linear-to-br from-brand-orange/10 via-surface to-surface p-10 shadow-card md:p-12">
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h3 className="font-display text-2xl font-semibold text-foreground text-balance sm:text-3xl">
              Want to automate your business?
            </h3>
            <p className="mt-2.5 text-sm text-muted md:text-base">
              {name} answers customer questions and captures leads 24/7 — and connects to the
              booking and reminder tools you already use, instead of replacing them. Try it on your
              site.
            </p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 flex-none items-center gap-2 rounded-lg bg-foreground px-6 text-sm font-medium text-surface transition-transform hover:scale-[1.02]"
          >
            Try {name}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </Section>
  );
}
