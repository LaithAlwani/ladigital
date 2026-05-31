"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  FileText,
  Layers,
  Tags,
  CalendarClock,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/projects", label: "Projects", icon: FolderGit2 },
  { href: "/admin/plans", label: "Plans", icon: Layers },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/pricing", label: "Pricing & offers", icon: Tags },
  { href: "/admin/availability", label: "Availability", icon: CalendarClock },
  { href: "/admin/connect", label: "Calendar", icon: CalendarCheck },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-orange/12 text-brand-orange"
                : "text-muted hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
