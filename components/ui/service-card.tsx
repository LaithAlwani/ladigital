"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { ServiceCategory } from "@/lib/types";
import { Icon } from "./icon";
import { StartingAt } from "./price-display";
import { fadeUp, fadeInstant } from "@/lib/motion";
import { usePlans, effectivePackages, cheapestPackage } from "@/lib/use-plans";

type Props = { service: ServiceCategory };

export function ServiceCard({ service }: Props) {
  const reduced = useReducedMotion();
  const plans = usePlans();
  const cheapest = cheapestPackage(effectivePackages(service, plans));

  return (
    <motion.div
      variants={reduced ? fadeInstant : fadeUp}
      whileHover={reduced ? undefined : { y: -4 }}
      transition={{ duration: 0.25 }}
      className="group relative flex h-full flex-col gap-4 rounded-card border border-border bg-linear-to-br from-surface to-surface-2 p-6 shadow-card transition-[border-color,box-shadow] duration-300 hover:border-border-strong hover:shadow-card-hover"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-md bg-brand-orange/12 text-brand-orange ring-1 ring-brand-orange/30">
          <Icon name={service.iconName} className="h-5 w-5" />
        </span>
        <h3 className="font-display text-lg font-semibold text-foreground">{service.name}</h3>
      </div>

      <p className="text-sm text-muted leading-relaxed">{service.summary}</p>

      <div className="mt-auto flex flex-col gap-3 pt-2">
        {cheapest ? <StartingAt price={cheapest.price} unit={cheapest.unit} /> : null}

        <Link
          href={service.cta.href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-orange transition-transform group-hover:translate-x-0.5"
        >
          {service.cta.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Hover glow accent */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-brand-orange/0 to-transparent transition-opacity duration-500 group-hover:via-brand-orange/60"
      />
    </motion.div>
  );
}
