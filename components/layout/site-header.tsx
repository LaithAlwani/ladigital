"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform, useMotionTemplate } from "motion/react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SocialLinks } from "@/components/layout/social-links";
import { useActiveSection } from "@/lib/use-active-section";
import { NavLink } from "./nav-link";
import { MobileMenu } from "./mobile-menu";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  /** If set, scroll-spy on this DOM id drives active state on the home page. */
  sectionId?: string;
};

const NAV: NavItem[] = [
  { href: "/", label: "Home", exact: true },
  { href: "/services", label: "Services" },
  { href: "/#process", label: "Process", sectionId: "process" },
  { href: "/#contact", label: "Contact", sectionId: "contact" },
];

const SCROLL_SPY_IDS = NAV.map((n) => n.sectionId).filter((id): id is string => Boolean(id));

/**
 * For a nav item, decide whether to force its active state. Returns:
 *   - `true`  → force active (this section is currently in view)
 *   - `false` → force inactive (Home, when the user has scrolled into a section)
 *   - `undefined` → fall back to NavLink's path-based logic
 */
export function resolveActive(item: NavItem, activeSection: string | null): boolean | undefined {
  if (item.sectionId) return activeSection === item.sectionId;
  if (item.href === "/" && activeSection) return false;
  return undefined;
}

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const activeSection = useActiveSection(SCROLL_SPY_IDS, isHome);

  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.85]);
  const bg = useMotionTemplate`rgba(7, 8, 10, ${bgOpacity})`;
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const borderColor = useMotionTemplate`rgba(255, 255, 255, ${useTransform(borderOpacity, (v) => v * 0.08)})`;
  const blur = useTransform(scrollY, [0, 80], [0, 12]);
  const backdropFilter = useMotionTemplate`blur(${blur}px)`;

  return (
    <>
      <motion.header
        style={{ background: bg, borderColor, backdropFilter }}
        className="fixed inset-x-0 top-0 z-40 border-b will-change-transform"
      >
        <Container>
          <div className="flex h-16 items-center justify-between gap-4">
            <Logo size="sm" priority />

            <nav className="hidden items-center gap-7 md:flex">
              {NAV.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  exact={item.exact}
                  isActive={resolveActive(item, activeSection)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <SocialLinks size="sm" />
              <Button href="/book" variant="primary" size="sm">
                Start a project
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-md border border-border text-foreground md:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </Container>
      </motion.header>
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        nav={NAV}
        activeSection={activeSection}
      />
    </>
  );
}

export type { NavItem };
