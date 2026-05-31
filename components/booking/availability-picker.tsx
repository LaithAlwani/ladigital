"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { motion, useReducedMotion } from "motion/react";
import { Loader2, CalendarX2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { DaySlots } from "@/convex/slots";
import { cn } from "@/lib/cn";

type Props = {
  selectedStart: number | null;
  onSelectStart: (startUtc: number, dayDate: string) => void;
};

function dayLabels(dateStr: string) {
  // Anchor at noon UTC so the calendar date is stable regardless of viewer tz.
  const d = new Date(`${dateStr}T12:00:00Z`);
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts }).format(d);
  return {
    weekday: fmt({ weekday: "short" }),
    day: fmt({ day: "numeric" }),
    month: fmt({ month: "short" }),
  };
}

export function AvailabilityPicker({ selectedStart, onSelectStart }: Props) {
  const days = useQuery(api.slots.list, {}) as DaySlots[] | undefined;
  const reduced = useReducedMotion();

  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  // Default to the first day that has open slots once data arrives.
  React.useEffect(() => {
    if (!days || selectedDate) return;
    const firstOpen = days.find((d) => d.slots.length > 0) ?? days[0];
    if (firstOpen) setSelectedDate(firstOpen.date);
  }, [days, selectedDate]);

  if (days === undefined) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-card border border-border bg-surface/40 py-16 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading availability…
      </div>
    );
  }

  const openDays = days.filter((d) => d.slots.length > 0);
  if (openDays.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface/40 py-16 text-center">
        <CalendarX2 className="h-7 w-7 text-muted-2" />
        <p className="text-sm text-muted">
          No times are open right now. Please check back soon or{" "}
          <a href="/#contact" className="text-brand-orange hover:underline">
            send us a message
          </a>
          .
        </p>
      </div>
    );
  }

  const activeDate = selectedDate ?? openDays[0].date;
  const activeDay = days.find((d) => d.date === activeDate);
  const morning = activeDay?.slots.filter((s) => s.label.includes("AM")) ?? [];
  const afternoon = activeDay?.slots.filter((s) => !s.label.includes("AM")) ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Day rail */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Pick a day
        </p>
        <div className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
          {days.map((d) => {
            const { weekday, day, month } = dayLabels(d.date);
            const isActive = d.date === activeDate;
            const isFull = d.slots.length === 0;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => {
                  if (isFull) return;
                  setSelectedDate(d.date);
                }}
                disabled={isFull}
                aria-pressed={isActive}
                className={cn(
                  "relative flex min-w-[4.75rem] shrink-0 snap-start flex-col items-center gap-1 rounded-xl border px-3 py-3 transition-all duration-200",
                  isActive
                    ? "border-brand-orange bg-brand-orange/10 shadow-glow-soft"
                    : "border-border bg-surface/40 hover:border-border-strong",
                  isFull && "cursor-not-allowed opacity-40 hover:border-border",
                )}
              >
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  {weekday}
                </span>
                <span
                  className={cn(
                    "font-display text-2xl font-semibold leading-none",
                    isActive ? "text-brand-orange" : "text-foreground",
                  )}
                >
                  {day}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-2">{month}</span>
                <span
                  className={cn(
                    "mt-0.5 h-1.5 w-1.5 rounded-full",
                    isFull ? "bg-muted-2/40" : "bg-success",
                  )}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Pick a time
        </p>
        <motion.div
          key={activeDate}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-5"
        >
          {[
            { label: "Morning", slots: morning },
            { label: "Afternoon", slots: afternoon },
          ].map((group) =>
            group.slots.length > 0 ? (
              <div key={group.label} className="flex flex-col gap-2.5">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-2">
                  {group.label}
                </span>
                <div className="flex flex-wrap gap-2">
                  {group.slots.map((s) => {
                    const isSel = s.startUtc === selectedStart;
                    return (
                      <button
                        key={s.startUtc}
                        type="button"
                        onClick={() => onSelectStart(s.startUtc, activeDate)}
                        aria-pressed={isSel}
                        className={cn(
                          "rounded-lg border px-4 py-2.5 text-sm font-medium tabular-nums transition-all duration-150",
                          isSel
                            ? "border-brand-orange bg-brand-orange text-white shadow-glow-soft"
                            : "border-border bg-surface/40 text-foreground hover:border-brand-orange hover:text-brand-orange",
                        )}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null,
          )}
        </motion.div>
      </div>
    </div>
  );
}
