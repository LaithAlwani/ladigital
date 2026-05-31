import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import {
  FolderGit2,
  Tags,
  CalendarClock,
  FileText,
  ArrowRight,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { formatBookingWhen } from "@/lib/booking-format";

export const dynamic = "force-dynamic";

const CARDS = [
  { href: "/admin/projects", label: "Projects", desc: "Add and edit portfolio work", icon: FolderGit2 },
  { href: "/admin/content", label: "Content", desc: "Headlines, copy, contact info", icon: FileText },
  { href: "/admin/pricing", label: "Pricing & offers", desc: "Plans, prices, promos", icon: Tags },
  { href: "/admin/availability", label: "Availability", desc: "Hours, slots, blackout dates", icon: CalendarClock },
];

export default async function AdminDashboard() {
  const now = Date.now();
  const [bookings, connected, rules] = await Promise.all([
    fetchQuery(api.bookings.listRange, { fromUtc: now, toUtc: now + 30 * 86_400_000 }).catch(() => []),
    fetchQuery(api.googleTokens.isConnected, {}).catch(() => false),
    fetchQuery(api.availability.getRules, {}).catch(() => null),
  ]);

  const upcoming = bookings
    .filter((b) => b.status !== "cancelled")
    .sort((a, b) => a.startUtc - b.startUtc)
    .slice(0, 6);
  const tz = rules?.timezone ?? "America/Toronto";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Manage your site without redeploying.</p>
      </div>

      {!connected ? (
        <Link
          href="/admin/connect"
          className="flex items-center gap-3 rounded-card border border-brand-orange/30 bg-brand-orange/10 px-4 py-3 text-sm text-foreground transition-colors hover:border-brand-orange/50"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-brand-orange" />
          Google Calendar isn't connected yet — bookings won't create calendar events.
          <span className="ml-auto inline-flex items-center gap-1 font-medium text-brand-orange">
            Connect <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      ) : null}

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group flex items-start gap-4 rounded-card border border-border bg-surface/40 p-5 transition-colors hover:border-border-strong"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-orange/12 text-brand-orange">
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-display text-base font-semibold text-foreground">{c.label}</p>
                <p className="mt-0.5 text-sm text-muted">{c.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 translate-x-0 text-muted-2 transition-transform group-hover:translate-x-1 group-hover:text-brand-orange" />
            </Link>
          );
        })}
      </div>

      {/* Upcoming bookings */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-brand-orange" />
          <h2 className="font-display text-lg font-semibold text-foreground">Upcoming calls</h2>
        </div>
        {upcoming.length === 0 ? (
          <div className="rounded-card border border-border bg-surface/40 p-6 text-sm text-muted">
            No upcoming bookings in the next 30 days.
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface/40">
            {upcoming.map((b) => (
              <div key={b._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{b.name}</p>
                  <p className="text-xs text-muted">{b.email}</p>
                </div>
                <p className="text-sm tabular-nums text-muted">
                  {formatBookingWhen(b.startUtc, b.endUtc, tz)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
