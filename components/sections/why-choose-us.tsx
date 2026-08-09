"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon } from "@/components/ui/icon";
import { siteConfig } from "@/lib/site-config";
import { fadeUp, stagger } from "@/lib/motion";

export function WhyChooseUs() {
  const reduced = useReducedMotion();

  return (
    <Section id="why" className="bg-ink-2/40">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Why LA Digital"
            title="Real websites. Real support. Fair prices."
            description="We're a small Ottawa team that builds proper websites for small businesses — no bloated agency retainers, and we don't disappear after launch."
          />

          <motion.ul
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={reduced ? undefined : stagger(0.05, 0.1)}
            className="mt-10 flex flex-col gap-6"
          >
            {siteConfig.valueProps.map((v) => (
              <motion.li
                key={v.title}
                variants={reduced ? undefined : fadeUp}
                className="flex items-start gap-4 rounded-card border border-border bg-surface/40 p-5 transition-colors hover:border-border-strong"
              >
                <span className="grid h-11 w-11 flex-none place-items-center rounded-md bg-brand-orange/12 text-brand-orange ring-1 ring-brand-orange/30">
                  <Icon name={v.iconName} className="h-5 w-5" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-display text-base font-semibold text-foreground">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{v.description}</p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative aspect-4/3 overflow-hidden rounded-card border border-border shadow-card"
        >
          <Image
            src="/8.jpg"
            alt="Best quality, service, and price"
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
            quality={75}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-tr from-foreground/25 via-foreground/5 to-transparent"
          />
          <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center gap-2 p-5">
            <span className="rounded-pill bg-ink/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-foreground ring-1 ring-border">
              Quality
            </span>
            <span className="rounded-pill bg-ink/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-foreground ring-1 ring-border">
              Service
            </span>
            <span className="rounded-pill bg-brand-orange px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-white">
              Price
            </span>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
