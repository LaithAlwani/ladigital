"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon } from "@/components/ui/icon";
import { fadeUp, fadeInstant, stagger } from "@/lib/motion";

type Svc = { icon: string; title: string; price: string; body: string };

const SERVICES: Svc[] = [
  { icon: "Smartphone", title: "Custom Mobile App", price: "Custom quote", body: "iOS & Android apps for your business, built and maintained by us." },
  { icon: "Server", title: "Custom Desktop App", price: "Custom quote", body: "Windows & macOS apps for your team and offline workflows." },
  { icon: "Layers", title: "Custom Software", price: "Custom quote", body: "Bespoke software built around exactly how you work." },
];

// The cross-sell grid: custom software/apps and hosting. Every card leads to a
// quick quote — the funnel after the $49 website.
export function MoreServices() {
  const reduced = useReducedMotion();

  return (
    <Section id="services">
      <SectionHeading
        eyebrow="Grow when you're ready"
        title="More ways we help your business grow."
        description="Start with a website, then add custom software or a full app as you grow — same friendly team, same fair pricing."
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={reduced ? undefined : stagger(0.04, 0.07)}
        className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {SERVICES.map((s) => (
          <motion.div
            key={s.title}
            variants={reduced ? fadeInstant : fadeUp}
            className="group flex flex-col gap-3 rounded-card border border-border bg-surface p-6 shadow-card transition-shadow duration-300 hover:shadow-card-hover"
          >
            <span className="grid h-11 w-11 place-items-center rounded-md bg-brand-orange/10 text-brand-orange ring-1 ring-brand-orange/20">
              <Icon name={s.icon} className="h-5 w-5" />
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-display text-lg font-semibold text-foreground">{s.title}</h3>
              <span className="font-mono text-xs font-medium text-brand-orange">{s.price}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted">{s.body}</p>
            <Link
              href="/book"
              className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-brand-orange transition-transform group-hover:translate-x-0.5"
            >
              Get a quote
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
