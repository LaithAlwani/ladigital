"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type Variant = "underline" | "pill";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  exact?: boolean;
  variant?: Variant;
  /**
   * Explicit override for the active state. Useful when the parent has more
   * context than the path alone — e.g. scroll-spy for hash links, or to force
   * a route link inactive when a same-page section is in view.
   * - `true` → forced active
   * - `false` → forced inactive
   * - `undefined` → derive from path
   */
  isActive?: boolean;
};

export function NavLink({
  href,
  children,
  className,
  onClick,
  exact,
  variant = "underline",
  isActive: isActiveOverride,
}: Props) {
  const pathname = usePathname();

  // Hash-only links (e.g. "/#process") are scroll anchors — by default, never
  // mark them active from path alone. Pass `isActive` explicitly when scroll-
  // spy says they should light up.
  const isHashLink = href.includes("#");
  const target = href.split("#")[0] || "/";
  const pathActive =
    !isHashLink &&
    (exact
      ? pathname === target
      : pathname === target || (target !== "/" && pathname.startsWith(target)));
  const isActive = isActiveOverride ?? pathActive;

  if (variant === "pill") {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "block rounded-lg border px-3 py-3 text-base transition-colors",
          isActive
            ? "border-brand-orange/40 bg-brand-orange/10 text-foreground"
            : "border-transparent text-muted hover:border-border hover:bg-surface/50 hover:text-foreground",
          className,
        )}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative text-sm font-medium text-muted transition-colors hover:text-foreground",
        isActive && "text-foreground",
        className,
      )}
    >
      {children}
      {isActive ? (
        <span
          aria-hidden
          className="absolute -bottom-1 left-0 right-0 mx-auto h-px w-6 bg-brand-orange"
        />
      ) : null}
    </Link>
  );
}
