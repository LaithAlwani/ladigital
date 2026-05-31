import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { BookingFlow } from "@/components/booking/booking-flow";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Book a discovery call",
  description:
    "Pick a time that works for you and book a free discovery call with LA Digital. We'll talk through your business, your goals, and the right plan to get there.",
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <section className="relative isolate overflow-hidden py-20 sm:py-28">
      {/* Ambient brand glow, consistent with the hero */}
      <div
        aria-hidden
        className="absolute left-1/2 top-0 -z-10 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-brand-orange/10 blur-3xl"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-grid opacity-20" />

      <Container size="lg">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Eyebrow className="justify-center">Discovery call · {siteConfig.contact.businessHours}</Eyebrow>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl">
            Let's find the right plan for your business.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted">
            Book a free 30-minute call. We'll learn about your business, answer your questions, and
            map out exactly how {siteConfig.company.name} can help — no pressure, no obligation.
          </p>
        </div>

        <BookingFlow />

        <p className="mx-auto mt-10 max-w-md text-center text-xs text-muted-2">
          Prefer to write instead?{" "}
          <a href="/#contact" className="text-brand-orange hover:underline">
            Send us a message
          </a>{" "}
          and we'll get back to you within one business day.
        </p>
      </Container>
    </section>
  );
}
