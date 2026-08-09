"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/lib/site-config";
import { fadeUp, stagger } from "@/lib/motion";

export function Process() {
  const reduced = useReducedMotion();

  return (
    <Section id="process">
      <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="relative aspect-4/3 overflow-hidden rounded-card border border-border shadow-card">
            <Image
              src="/6.jpg"
              alt="Wooden cubes spelling Step By Step"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
              quality={75}
            />
            <div aria-hidden className="absolute inset-0 bg-linear-to-tr from-foreground/25 via-foreground/5 to-transparent" />
          </div>
          <div className="mt-6 lg:sticky lg:top-24">
            <SectionHeading
              eyebrow="How it works"
              title="A simple, predictable path from idea to launch."
              description="No mystery, no surprise invoices — just a few simple steps to get you online for $49/month."
            />
          </div>
        </motion.div>

        <motion.ol
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={reduced ? undefined : stagger(0.05, 0.1)}
          className="relative flex flex-col gap-5"
        >
          {/*
            Connector line that runs through the center of each step number
            circle. Geometry: each circle is h-12 (3rem); each <li> has p-5
            (1.25rem) of padding; the circle is the first flex child, so:
              circle center X (from <ol> left)        = 1.25rem + 1.5rem = 2.75rem
              first circle center Y (from <ol> top)   = 1.25rem + 1.5rem = 2.75rem
              last circle center Y (from <ol> bottom) = 1.25rem + 1.5rem = 2.75rem
            -translate-x-1/2 centers the line's width on the circle center
            regardless of line thickness.
          */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-11 top-11 bottom-11  w-px -translate-x-1/2 bg-brand-orange/40"
          />
          {siteConfig.process.map((step) => (
            <motion.li
              key={step.number}
              variants={reduced ? undefined : fadeUp}
              className="relative flex items-start gap-5 rounded-card border border-border bg-surface/50 p-5 transition-colors hover:border-border-strong"
            >
              <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-ink-2 font-display text-sm font-semibold text-brand-orange ring-1 ring-brand-orange/40">
                {step.number}
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-display text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </Section>
  );
}
