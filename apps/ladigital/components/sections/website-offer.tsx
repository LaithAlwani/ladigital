"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { PackageCard } from "@/components/ui/package-card";
import { siteConfig } from "@/lib/site-config";
import { usePlans, effectivePackages } from "@/lib/use-plans";
import { stagger } from "@/lib/motion";

const TRUST = ["No big upfront cost", "Hosting & maintenance included", "Cancel anytime"];

// The website offer — a clean $49 vs $99 (with booking) ladder. Renders the
// Convex-backed website packages (categoryId "plans") with a static fallback.
export function WebsiteOffer() {
  const reduced = useReducedMotion();
  const plans = usePlans();
  const websites = siteConfig.services.find((s) => s.id === "plans")!;
  const packages = effectivePackages(websites, plans);

  return (
    <Section id="websites" className="bg-ink-2/60">
      <SectionHeading
        align="center"
        eyebrow="Simple, honest pricing"
        title="Pick the plan that grows your business."
        description="A professional website that gets you found for $49/month. Taking appointments? Add 24/7 online booking for $99 and stop missing customers. Both include hosting, maintenance, and support."
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={reduced ? undefined : stagger(0.06, 0.1)}
        className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-2"
      >
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} service={websites} pkg={pkg} />
        ))}
      </motion.div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {TRUST.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 text-sm text-muted">
            <Check className="h-4 w-4 text-brand-orange" />
            {t}
          </span>
        ))}
      </div>
    </Section>
  );
}
