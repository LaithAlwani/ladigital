"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import * as React from "react";
import { fadeUp, fadeInstant } from "@/lib/motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variants?: Variants;
  /** Element tag to render. Defaults to "div". */
  as?: "div" | "section" | "article" | "li" | "ul" | "header" | "footer";
};

export function Reveal({ children, className, delay = 0, variants, as = "div" }: Props) {
  const reduced = useReducedMotion();
  const v = reduced ? fadeInstant : (variants ?? fadeUp);
  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      className={className}
      variants={v}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}
