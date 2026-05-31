"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  Loader2,
  Video,
  XCircle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { rescheduleBooking, cancelBooking } from "@/app/actions/booking";
import { formatBookingWhen } from "@/lib/booking-format";
import { AvailabilityPicker } from "./availability-picker";
import { cn } from "@/lib/cn";

type View = "overview" | "reschedule" | "confirmCancel";

export function ManageBooking({ token, timezone }: { token: string; timezone: string }) {
  const reduced = useReducedMotion();
  const booking = useQuery(api.bookings.getByToken, { token });

  const [view, setView] = React.useState<View>("overview");
  const [selectedStart, setSelectedStart] = React.useState<number | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [flash, setFlash] = React.useState<string | null>(null);

  if (booking === undefined) {
    return (
      <Card>
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your booking…
        </div>
      </Card>
    );
  }

  if (booking === null) {
    return (
      <Card>
        <Centered
          icon={<CalendarX2 className="h-7 w-7 text-muted-2" />}
          title="Booking not found"
          body="This link may have expired or already been used. If you need to book a call, you can start again."
        >
          <a
            href="/book"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow"
          >
            Book a call
          </a>
        </Centered>
      </Card>
    );
  }

  const whenText = formatBookingWhen(booking.startUtc, booking.endUtc, timezone);

  if (booking.status === "cancelled") {
    return (
      <Card>
        <Centered
          icon={<XCircle className="h-7 w-7 text-muted-2" />}
          title="This call was cancelled"
          body="No problem — you can book a new time whenever you're ready."
        >
          <a
            href="/book"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow"
          >
            Book a new time
          </a>
        </Centered>
      </Card>
    );
  }

  function doReschedule() {
    if (selectedStart === null) return;
    setError(null);
    startTransition(async () => {
      const r = await rescheduleBooking(token, selectedStart);
      if (r.ok) {
        setView("overview");
        setSelectedStart(null);
        setFlash("Your call has been rescheduled. We've emailed you the new details.");
      } else {
        setError(r.message);
      }
    });
  }

  function doCancel() {
    setError(null);
    startTransition(async () => {
      const r = await cancelBooking(token);
      if (!r.ok) setError(r.message);
      // On success the live query flips status to "cancelled" and re-renders.
    });
  }

  return (
    <Card>
      <AnimatePresence mode="wait" initial={false}>
        {view === "overview" ? (
          <motion.div
            key="overview"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5"
          >
            {flash ? (
              <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-2.5 text-sm text-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {flash}
              </div>
            ) : null}

            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-2">Your discovery call</p>
              <p className="mt-1.5 font-display text-xl font-semibold text-foreground">{whenText}</p>
              <p className="mt-1 text-sm text-muted">Booked under {booking.name}</p>
            </div>

            {booking.meetLink ? (
              <a
                href={booking.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-border-strong px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
              >
                <Video className="h-4 w-4" />
                Join Google Meet
              </a>
            ) : null}

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setFlash(null);
                  setView("reschedule");
                }}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-orange px-5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow"
              >
                <CalendarClock className="h-4 w-4" />
                Reschedule
              </button>
              <button
                type="button"
                onClick={() => {
                  setFlash(null);
                  setView("confirmCancel");
                }}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border-strong px-5 text-sm font-medium text-foreground transition-colors hover:border-danger hover:text-danger"
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </motion.div>
        ) : null}

        {view === "reschedule" ? (
          <motion.div
            key="reschedule"
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5"
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-2">Currently</p>
              <p className="mt-1 text-sm text-muted line-through">{whenText}</p>
            </div>

            <AvailabilityPicker selectedStart={selectedStart} onSelectStart={(s) => setSelectedStart(s)} />

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setView("overview");
                  setSelectedStart(null);
                  setError(null);
                }}
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-border-strong px-5 text-sm font-medium text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                disabled={selectedStart === null || pending}
                onClick={doReschedule}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-orange px-6 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Rescheduling…
                  </>
                ) : (
                  "Confirm new time"
                )}
              </button>
            </div>
          </motion.div>
        ) : null}

        {view === "confirmCancel" ? (
          <motion.div
            key="confirmCancel"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5"
          >
            <Centered
              icon={<XCircle className="h-7 w-7 text-danger" />}
              title="Cancel this call?"
              body={whenText}
            />
            {error ? <p className="text-center text-sm text-danger">{error}</p> : null}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setView("overview");
                  setError(null);
                }}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-border-strong px-5 text-sm font-medium text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
              >
                Keep it
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={doCancel}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-danger/90 px-6 text-sm font-medium text-white transition-all hover:bg-danger disabled:cursor-wait disabled:opacity-70"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling…
                  </>
                ) : (
                  "Cancel call"
                )}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn("mx-auto w-full max-w-xl rounded-card border border-border bg-surface/40 p-6 md:p-8")}>
      {children}
    </div>
  );
}

function Centered({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2">{icon}</span>
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {children}
    </div>
  );
}
