"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialLinks } from "@/components/layout/social-links";
import { siteConfig } from "@/lib/site-config";
import { NavLink } from "./nav-link";
import { resolveActive, type NavItem } from "./site-header";

type Props = {
  open: boolean;
  onClose: () => void;
  nav: NavItem[];
  activeSection: string | null;
};

export function MobileMenu({ open, onClose, nav, activeSection }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            key="panel"
            className="fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col gap-6 border-l border-border bg-ink-2 p-6 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Menu</span>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {nav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  variant="pill"
                  exact={item.exact}
                  isActive={resolveActive(item, activeSection)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-4 border-t border-border pt-5">
              <div className="flex flex-col gap-1 text-sm">
                <a href={`mailto:${siteConfig.contact.email}`} className="text-foreground hover:text-brand-orange">
                  {siteConfig.contact.email}
                </a>
                {siteConfig.contact.phone ? (
                  <a href={`tel:${siteConfig.contact.phone}`} className="text-muted hover:text-foreground">
                    {siteConfig.contact.phone}
                  </a>
                ) : null}
                <span className="text-xs text-muted-2">{siteConfig.contact.city}, {siteConfig.contact.region}</span>
              </div>
              <SocialLinks size="md" />
              <Button href="/#contact" variant="primary" fullWidth onClick={onClose}>
                Start a project
              </Button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
