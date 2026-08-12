"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PriceTag } from "@/components/ui/price-tag";
import { siteConfig } from "@/lib/site-config";
import { useSettings } from "@/lib/use-settings";
import { fadeUp, stagger } from "@/lib/motion";

const TRUST = ["Found on Google", "Booking built in", "No big upfront cost"];

export function Hero() {
  const reduced = useReducedMotion();
  const settings = useSettings();
  const containerVariants = reduced ? undefined : stagger(0.08, 0.1);
  const itemVariants = reduced ? { hidden: { opacity: 0 }, show: { opacity: 1 } } : fadeUp;

  const headline = settings?.company?.heroHeadline ?? siteConfig.company.heroHeadline;
  const subheadline = settings?.company?.heroSubheadline ?? siteConfig.company.heroSubheadline;
  const offerActive = settings?.offer?.enabled && settings.offer.text;
  const promoText = offerActive
    ? settings!.offer!.text!
    : settings?.pricing?.annualPromoLine ?? siteConfig.pricing.annualPromoLine;

  return (
    <section className="relative isolate overflow-hidden pt-28 pb-16 sm:pt-32">
      {/* Light ambient wash + subtle grid */}
      <div aria-hidden className="sunrise-wash absolute inset-0 -z-10" />
      <div aria-hidden className="bg-grid absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Copy */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="flex max-w-xl flex-col gap-6"
          >
            <motion.div variants={itemVariants}>
              <Eyebrow>Small-business growth · Ottawa, Canada</Eyebrow>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl"
            >
              {headline}
            </motion.h1>

            <motion.p variants={itemVariants} className="max-w-lg text-base text-muted sm:text-lg">
              {subheadline}
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {TRUST.map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Check className="h-4 w-4 text-brand-orange" />
                  {t}
                </span>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="mt-1 flex flex-wrap items-center gap-3">
              <Button href="/book" variant="primary" size="lg">
                Get more customers
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/#websites" variant="outline" size="lg">
                See plans & pricing
              </Button>
            </motion.div>

            <motion.p variants={itemVariants} className="text-xs text-muted-2">
              {promoText}
            </motion.p>
          </motion.div>

          {/* Website-preview mockup with the price tag stuck on it (signature) */}
          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 24, scale: 0.98 }}
            animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card-hover">
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 border-b border-border bg-surface-2 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                <span className="ml-3 h-4 flex-1 rounded-full bg-surface" />
              </div>
              {/* Fake site content */}
              <div className="flex flex-col gap-4 p-6">
                <div className="h-24 rounded-lg bg-linear-to-br from-brand-orange/15 to-surface-2" />
                <div className="h-3 w-3/4 rounded-full bg-surface-2" />
                <div className="h-3 w-1/2 rounded-full bg-surface-2" />
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="h-14 rounded-lg bg-surface-2" />
                  <div className="h-14 rounded-lg bg-surface-2" />
                  <div className="h-14 rounded-lg bg-surface-2" />
                </div>
                <div className="mt-1 h-9 w-32 rounded-lg bg-brand-orange/90" />
              </div>
            </div>
            {/* The signature price tag */}
            <div className="absolute -right-3 -top-4 sm:-right-5">
              <PriceTag price="$49" unit="/mo" size="lg" />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
