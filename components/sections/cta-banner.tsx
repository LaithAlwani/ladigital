import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

type Props = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function CtaBanner({
  title = "Not sure which plan fits? Let's talk.",
  description = "Book a quick discovery call and we'll recommend the right plan, add-ons, and growth services for your business.",
  ctaLabel = "Book a discovery call",
  ctaHref = "/book",
}: Props) {
  return (
    <Section padding="sm" withContainer={false}>
      <Container>
        <div className="relative overflow-hidden rounded-card border border-brand-orange/30 bg-linear-to-br from-brand-orange/15 via-surface to-surface p-10 md:p-12">
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_50%,rgba(255,106,0,0.35),transparent_70%)]"
          />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex max-w-2xl flex-col gap-2.5">
              <h3 className="font-display text-2xl font-semibold text-foreground text-balance sm:text-3xl">
                {title}
              </h3>
              <p className="text-sm text-muted md:text-base">{description}</p>
            </div>
            <Button href={ctaHref} variant="primary" size="lg">
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
