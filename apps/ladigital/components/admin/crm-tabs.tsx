"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin/crm", label: "Pipeline", exact: true },
  { href: "/admin/crm/contacts", label: "Contacts" },
];

export function CrmTabs() {
  const pathname = usePathname();
  return (
    <div className="inline-flex rounded-xl border border-border bg-surface-2/50 p-1">
      {TABS.map((t) => {
        const active = t.exact ? pathname === t.href : pathname?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
