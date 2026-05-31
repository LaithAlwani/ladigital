"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { PackageCard } from "@/components/ui/package-card";
import { formatCAD } from "@/lib/format";
import { cn } from "@/lib/cn";
import { stagger } from "@/lib/motion";
import { usePlans, effectivePackages } from "@/lib/use-plans";
import type { ServicePackage } from "@/lib/types";

export function ServicesFull() {
  const plans = usePlans();
  return (
    <>
      <CategoryNav />
      <div className="flex flex-col gap-24 md:gap-32">
        {siteConfig.services.map((service, idx) => (
          <CategoryBlock
            key={service.id}
            service={service}
            packages={effectivePackages(service, plans)}
            reverse={idx % 2 === 1}
          />
        ))}
      </div>
    </>
  );
}

function CategoryNav() {
  return (
    <nav
      aria-label="Service categories"
      className="sticky top-16 z-30 -mx-5 mb-16 border-y border-border bg-ink/85 px-5 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      <Container size="xl" className="px-0!">
        <ul className="flex gap-2 overflow-x-auto scrollbar-none">
          {siteConfig.services.map((s) => (
            <li key={s.id} className="flex-none">
              <a
                href={`#${s.id}`}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-border bg-surface/40 px-3.5 py-1.5 text-xs font-medium text-muted transition-all hover:border-brand-orange/40 hover:bg-brand-orange/10 hover:text-brand-orange"
              >
                <Icon name={s.iconName} className="h-3.5 w-3.5" />
                {s.name}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}

function CategoryBlock({
  service,
  packages,
  reverse,
}: {
  service: (typeof siteConfig.services)[number];
  packages: ServicePackage[];
  reverse: boolean;
}) {
  const reduced = useReducedMotion();
  const hasImage = Boolean(service.image);
  const hasOptionsCard = packages.some((p) => p.options && p.options.length > 0);
  const cols =
    packages.length === 1
      ? hasOptionsCard
        ? "md:grid-cols-1 md:max-w-3xl mx-auto"
        : "md:grid-cols-1 md:max-w-md"
      : packages.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-3";

  return (
    <section id={service.id} className="scroll-mt-32">
      <div
        className={cn(
          "grid items-center gap-10 lg:gap-16",
          hasImage ? "lg:grid-cols-2" : "lg:grid-cols-1",
        )}
      >
        {hasImage ? (
          <motion.div
            initial={{ opacity: 0, x: reverse ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative aspect-4/3 overflow-hidden rounded-card border border-border shadow-card",
              reverse && "lg:order-2",
            )}
          >
            <Image
              src={service.image as string}
              alt={service.name}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
              quality={75}
            />
            <div aria-hidden className="absolute inset-0 bg-linear-to-tr from-ink/55 via-ink/15 to-transparent" />
            <div className="absolute left-5 top-5">
              <span className="inline-flex items-center gap-2 rounded-pill bg-ink/80 px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-border">
                <Icon name={service.iconName} className="h-3.5 w-3.5 text-brand-orange" />
                {service.name}
              </span>
            </div>
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, x: hasImage ? (reverse ? -20 : 20) : 0, y: hasImage ? 0 : 20 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={cn("flex flex-col gap-4", reverse && "lg:order-1")}
        >
          <div className="inline-flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-orange/12 text-brand-orange ring-1 ring-brand-orange/30">
              <Icon name={service.iconName} className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-brand-orange">
              {service.name}
            </span>
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {service.summary}
          </h2>
          {service.longDescription ? (
            <p className="max-w-xl text-base text-muted">{service.longDescription}</p>
          ) : null}
          {service.id === "plans" && siteConfig.pricing.setupWaivedAnnual ? (
            <div className="mt-2 inline-flex flex-wrap items-center gap-2 self-start rounded-pill border border-brand-orange/40 bg-brand-orange/10 px-3.5 py-1.5 text-xs font-semibold text-brand-orange">
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {formatCAD(siteConfig.pricing.setupFee)} setup —{" "}
                <span className="font-bold">$0 with annual commitment.</span>
              </span>
            </div>
          ) : null}
        </motion.div>
      </div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={reduced ? undefined : stagger(0.05, 0.08)}
        className={cn("mt-10 grid grid-cols-1 gap-5", cols)}
      >
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} service={service} pkg={pkg} />
        ))}
      </motion.div>
    </section>
  );
}
