"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { formatCAD } from "@/lib/format";
import { cn } from "@/lib/cn";

type Unit = "one-time" | "per-month" | "per-project";

type Props = {
  price: number;
  /**
   * Optional ongoing monthly price — rendered as a secondary "+ $X/mo" line
   * under the main price. When provided, the main `price` is treated as a
   * one-time setup fee regardless of `unit`.
   */
  monthlyPrice?: number;
  /**
   * Optional one-time setup fee — rendered as a small secondary line under
   * a monthly price. When `setupWaivedAnnual` is true the line is presented
   * with strikethrough + "waived with annual commitment" copy.
   */
  setupFee?: number;
  setupWaivedAnnual?: boolean;
  unit?: Unit;
  emphasis?: "lg" | "xl";
  className?: string;
};

const EMPHASIS = {
  lg: "text-3xl sm:text-4xl",
  xl: "text-4xl sm:text-5xl md:text-6xl",
};

export function PriceDisplay({
  price,
  monthlyPrice,
  setupFee,
  setupWaivedAnnual,
  unit,
  emphasis = "lg",
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? price : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    const duration = 700;
    const startTs = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      setShown(Math.round(price * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, price, reduced]);

  if (price === 0) {
    return (
      <div ref={ref} className={cn("font-display font-semibold", EMPHASIS[emphasis], className)}>
        Custom quote
      </div>
    );
  }

  // Suffix on the main price: "/mo" for a pure monthly retainer. Setup-only and
  // setup+monthly packages render no suffix — the monthly is on its own line.
  const mainSuffix = monthlyPrice ? null : unit === "per-month" ? "/mo" : null;

  return (
    <div ref={ref} className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
        Starting at
      </span>
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 leading-none">
        <span className={cn("font-display font-semibold tabular-nums text-foreground", EMPHASIS[emphasis])}>
          {formatCAD(shown)}
        </span>
        {mainSuffix ? (
          <span className="text-sm font-medium text-muted">{mainSuffix}</span>
        ) : null}
        <span className="ml-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-muted-2">
          CAD
        </span>
      </div>
      {monthlyPrice ? (
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm text-muted">+</span>
          <span className="font-display text-lg font-semibold tabular-nums text-foreground/90">
            {formatCAD(monthlyPrice)}
          </span>
          <span className="text-xs font-medium text-muted">/mo</span>
        </div>
      ) : null}
      {setupFee ? (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-xs font-medium text-muted">+</span>
          <span
            className={cn(
              "font-display text-sm font-semibold tabular-nums",
              setupWaivedAnnual ? "text-muted-2 line-through" : "text-foreground/90",
            )}
          >
            {formatCAD(setupFee)}
          </span>
          <span className="text-xs font-medium text-muted">setup</span>
          {setupWaivedAnnual ? (
            <span className="text-xs font-semibold text-brand-orange">
              · $0 with annual
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
