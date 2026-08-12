"use client";

import { useEffect, useState } from "react";

/**
 * Track which of the given DOM section ids the reader is currently in.
 *
 * Uses scroll position — the active section is the last one whose top has
 * crossed a reference line ~35% down the viewport — rather than intersection
 * ratios. An IntersectionObserver "active band" leaves gaps between sections
 * where nothing is active, which made the nav blink back to Home mid-scroll.
 * With this approach the active id only becomes null when you're above the
 * first section (in the hero), so Home lights up there and nowhere else.
 */
export function useActiveSection(ids: string[], enabled = true): string | null {
  const key = ids.join(",");
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || ids.length === 0) {
      setActive(null);
      return;
    }
    if (typeof window === "undefined") return;

    let raf = 0;

    const compute = () => {
      raf = 0;
      const line = window.innerHeight * 0.35;
      const els = ids
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

      // The active section is the last one whose top has scrolled above the
      // reference line. In the gap between two sections that stays the earlier
      // one; above the first section it's null (hero → Home).
      let current: string | null = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
        else break;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    // key represents the array contents; intentional to avoid array identity issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return active;
}
