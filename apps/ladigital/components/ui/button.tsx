"use client";

import Link from "next/link";
import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
};

type ButtonProps = BaseProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { href?: never };
type LinkProps = BaseProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href"> & { href: string };
type Props = ButtonProps | LinkProps;

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-brand-orange text-white hover:bg-brand-orange-soft hover:shadow-glow border border-transparent",
  secondary:
    "bg-surface text-foreground border border-border hover:border-border-strong hover:bg-surface-2",
  ghost: "bg-transparent text-foreground hover:bg-surface/60",
  outline:
    "bg-transparent text-foreground border border-border-strong hover:border-brand-orange hover:text-brand-orange",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-md",
  md: "h-11 px-5 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-lg",
};

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 select-none whitespace-nowrap disabled:pointer-events-none disabled:opacity-50";

/**
 * Button renders either an <a> (when `href` is provided) or a <button>, wrapped
 * in a motion.span so we get hover/tap scaling without leaking motion's drag
 * handlers onto the underlying element.
 */
export function Button(props: Props) {
  const { variant = "primary", size = "md", className, children, fullWidth, ...rest } = props;
  const reduced = useReducedMotion();

  const cls = cn(BASE, VARIANT[variant], SIZE[size], fullWidth && "w-full", className);

  const motionProps = reduced
    ? {}
    : { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...anchorRest } = rest as LinkProps;
    return (
      <motion.span {...motionProps} className={cn("inline-flex", fullWidth && "w-full")}>
        <Link href={href} className={cls} {...anchorRest}>
          {children}
        </Link>
      </motion.span>
    );
  }

  const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <motion.span {...motionProps} className={cn("inline-flex", fullWidth && "w-full")}>
      <button type="button" className={cls} {...buttonRest}>
        {children}
      </button>
    </motion.span>
  );
}
