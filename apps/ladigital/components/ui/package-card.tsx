"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ServiceCategory, ServicePackage } from "@/lib/types";
import { Badge } from "./badge";
import { Button } from "./button";
import { FeatureList } from "./feature-list";
import { PriceDisplay } from "./price-display";
import { formatCAD } from "@/lib/format";
import { cn } from "@/lib/cn";
import { fadeUp, fadeInstant } from "@/lib/motion";

type Props = {
  service: ServiceCategory;
  pkg: ServicePackage;
};

export function PackageCard({ pkg }: Props) {
  const reduced = useReducedMotion();
  const href = "/book";
  const isOptionMenu = Boolean(pkg.options && pkg.options.length > 0);

  return (
    <motion.article
      variants={reduced ? fadeInstant : fadeUp}
      className={cn(
        "relative flex h-full flex-col gap-5 rounded-card border bg-surface p-6 shadow-card transition-shadow duration-300",
        pkg.highlight
          ? "border-brand-orange/40 shadow-glow-soft hover:shadow-glow"
          : "border-border hover:border-border-strong hover:shadow-card-hover",
      )}
    >
      {pkg.highlight ? (
        <Badge variant="orange" className="absolute -top-2.5 left-6">
          Most popular
        </Badge>
      ) : null}

      <header className="flex flex-col gap-1.5">
        <h3 className="font-display text-xl font-semibold text-foreground">{pkg.name}</h3>
        {pkg.tagline ? <p className="text-sm text-muted">{pkg.tagline}</p> : null}
      </header>

      {isOptionMenu ? (
        // À-la-carte priced menu — replaces both the big PriceDisplay and the
        // FeatureList. Each option shows on its own row with a "from $X" price.
        <dl className="-mx-1 flex flex-1 flex-col md:columns-2 md:gap-x-6">
          {pkg.options!.map((opt) => (
            <div
              key={opt.name}
              className="flex items-baseline justify-between gap-3 break-inside-avoid border-b border-border/60 px-1 py-2.5 last:border-b-0"
            >
              <dt className="text-sm text-foreground">{opt.name}</dt>
              <dd className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-2">
                  from
                </span>
                <span className="font-display text-sm font-semibold tabular-nums text-foreground">
                  {formatCAD(opt.price)}
                </span>
                {opt.unit === "per-month" ? (
                  <span className="text-xs font-medium text-muted">/mo</span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <>
          <div className="border-y border-border py-5">
            <PriceDisplay
              price={pkg.price}
              monthlyPrice={pkg.monthlyPrice}
              setupFee={pkg.setupFee}
              setupWaivedAnnual={pkg.setupWaivedAnnual}
              unit={pkg.unit}
              emphasis="lg"
            />
          </div>
          <FeatureList items={pkg.features} className="flex-1" />
        </>
      )}

      {pkg.notes && pkg.notes.length > 0 ? (
        <ul className="space-y-1 text-xs text-muted-2">
          {pkg.notes.map((n) => (
            <li key={n}>• {n}</li>
          ))}
        </ul>
      ) : null}

      <Button
        variant={pkg.highlight ? "primary" : "outline"}
        size="md"
        href={href}
        fullWidth
        className="mt-2"
      >
        {pkg.ctaLabel ?? (pkg.unit === "per-month" ? "Start this plan" : "Get started")}
      </Button>
    </motion.article>
  );
}
