"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { siteConfig } from "@/lib/site-config";
import { fadeUp, stagger } from "@/lib/motion";

export function Hero() {
  const reduced = useReducedMotion();
  const containerVariants = reduced ? undefined : stagger(0.1, 0.12);
  const itemVariants = reduced ? { hidden: { opacity: 0 }, show: { opacity: 1 } } : fadeUp;

  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-16">
      {/* Background video */}
      <div className="absolute inset-0 -z-20">
        <video
          className="h-full w-full object-cover"
          src="/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
      </div>
      {/* Dark overlay for legibility */}
      <div className="absolute inset-0 -z-10 hero-mask" aria-hidden />
      {/* Subtle grid */}
      <div className="absolute inset-0 -z-10 bg-grid opacity-30" aria-hidden />
      {/* Orange ambient blur top-right */}
      <div
        aria-hidden
        className="absolute right-[-10%] top-[-10%] -z-10 h-[40rem] w-[40rem] rounded-full bg-brand-orange/15 blur-3xl"
      />

      <Container className="relative">
        <motion.div
          initial="hidden"
          animate="show"
          variants={containerVariants}
          className="flex max-w-3xl flex-col gap-6"
        >
          <motion.div variants={itemVariants}>
            <Eyebrow>Business platform · Subscription · Ottawa</Eyebrow>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-display text-4xl font-semibold leading-[1.04] tracking-tight text-foreground text-balance sm:text-6xl md:text-7xl"
          >
            {siteConfig.company.heroHeadline}
          </motion.h1>

          <motion.p variants={itemVariants} className="max-w-2xl text-base text-muted sm:text-lg">
            {siteConfig.company.heroSubheadline}
          </motion.p>

          <motion.div variants={itemVariants} className="mt-2">
            <span className="inline-flex items-center gap-2 rounded-pill border border-brand-orange/40 bg-brand-orange/12 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-orange">
              <Sparkles className="h-3.5 w-3.5" />
              {siteConfig.pricing.annualPromoLine}
            </span>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-4 flex flex-wrap items-center gap-3">
            <Button href="/services" variant="primary" size="lg">
              See plans
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/book" variant="outline" size="lg">
              <Play className="h-4 w-4" />
              Book a discovery call
            </Button>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-2">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Now onboarding new clients
            </span>
            <span>Monthly subscription, no long contracts</span>
            <span>Transparent pricing in CAD</span>
          </motion.div>
        </motion.div>
      </Container>

      {/* Scroll cue */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-muted-2 sm:block"
      >
        <span className="flex flex-col items-center gap-2">
          Scroll
          <span className="h-8 w-px bg-linear-to-b from-brand-orange to-transparent" />
        </span>
      </motion.div>
    </section>
  );
}
