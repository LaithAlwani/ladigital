"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, ExternalLink } from "lucide-react";
import { signOutAdmin } from "@/app/actions/admin-auth";
import { AdminNav } from "./admin-nav";
import { Logo } from "@/components/ui/logo";

function Footer() {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <ExternalLink className="h-4 w-4" />
        View site
      </Link>
      <form action={signOutAdmin}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Close the mobile drawer whenever the route changes.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-ink-2/60 p-4 lg:hidden">
        <Logo size="sm" href="/admin" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-lg border border-border text-foreground transition-colors hover:border-border-strong"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85%] flex-col gap-6 border-l border-border bg-ink-2 p-4">
            <div className="flex items-center justify-between">
              <Logo size="sm" href="/admin" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminNav />
            </div>
            <Footer />
          </div>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:gap-6 lg:border-r lg:border-border lg:bg-ink-2/60 lg:p-4">
        <div className="px-1">
          <Logo size="sm" href="/admin" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <AdminNav />
        </div>
        <Footer />
      </aside>
    </>
  );
}
