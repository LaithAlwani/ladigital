"use client";

import { motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { faqItems } from "@/lib/faq";
import { CONTENT_LAST_UPDATED } from "@/lib/site-config";
import { fadeUp, stagger } from "@/lib/motion";

// Deterministic formatted "last updated" date (freshness signal for AEO).
const UPDATED = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
}).format(new Date(`${CONTENT_LAST_UPDATED}T12:00:00Z`));

/**
 * FAQ section. Uses native `<details>` / `<summary>` so the content is in the
 * server-rendered HTML — important for SEO/AEO (answer engines index the text)
 * and for matching the FAQPage JSON-LD on the same page.
 */
export function Faq() {
  const reduced = useReducedMotion();

  return (
    <Section id="faq" className="bg-ink-2/30">
      <SectionHeading
        eyebrow="Frequently asked"
        title="Answers to the questions we get most."
        description="Still curious? Book a quick call — we'll walk you through anything not covered here."
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={reduced ? undefined : stagger(0.03, 0.06)}
        className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-2"
      >
        {faqItems.map((item) => (
          <motion.details
            key={item.question}
            variants={reduced ? undefined : fadeUp}
            className="group rounded-card border border-border bg-surface/40 transition-colors hover:border-border-strong open:border-brand-orange/40 open:bg-surface/70"
          >
            <summary className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4 text-sm font-medium text-foreground list-none [&::-webkit-details-marker]:hidden">
              <span className="flex-1 leading-snug">{item.question}</span>
              <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-brand-orange/12 text-brand-orange ring-1 ring-brand-orange/30 transition-transform group-open:rotate-45">
                <Plus className="h-3.5 w-3.5" />
              </span>
            </summary>
            <div className="border-t border-border px-5 pb-5 pt-3 text-sm leading-relaxed text-muted">
              {item.answer}
            </div>
          </motion.details>
        ))}
      </motion.div>

      <p className="mt-8 text-center font-mono text-xs text-muted-2">Last updated {UPDATED}</p>
    </Section>
  );
}
