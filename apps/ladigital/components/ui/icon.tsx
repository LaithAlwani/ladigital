"use client";

import {
  ArrowRight,
  BadgeDollarSign,
  Bot,
  Check,
  CheckCircle2,
  Database,
  Globe,
  Headphones,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  Send,
  Server,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TrendingUp,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

const REGISTRY = {
  ArrowRight,
  BadgeDollarSign,
  Bot,
  Check,
  CheckCircle2,
  Database,
  Globe,
  Headphones,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  Send,
  Server,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  X,
  Zap,
} as const;

export type IconName = keyof typeof REGISTRY;

type Props = {
  name: string;
  className?: string;
  strokeWidth?: number;
  size?: number;
};

/**
 * Lookup-friendly icon component. Accepts string names (from site-config) and
 * falls back to Sparkles if the icon isn't in the registry.
 */
export function Icon({ name, className, strokeWidth = 1.75, size }: Props) {
  const Cmp: LucideIcon = (REGISTRY as Record<string, LucideIcon>)[name] ?? Sparkles;
  return <Cmp className={className} strokeWidth={strokeWidth} size={size} aria-hidden />;
}
