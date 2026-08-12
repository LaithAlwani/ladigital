"use client";

import * as React from "react";
import { useActionState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, CalendarCheck, CheckCircle2, Loader2, Video } from "lucide-react";
import { submitBooking } from "@/app/actions/booking";
import { INITIAL_BOOKING_STATE, type BookingFieldErrors } from "@/lib/schemas";
import { formatBookingDay, formatBookingTime, formatBookingWhen } from "@/lib/booking-format";
import { AvailabilityPicker } from "./availability-picker";
import { cn } from "@/lib/cn";

const inputBase =
  "w-full rounded-lg border border-border bg-ink/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-2 transition-colors focus:border-brand-orange focus:bg-ink/60 focus:outline-none";
const labelBase = "text-xs font-medium uppercase tracking-[0.14em] text-muted";

const STEPS = ["Schedule", "Your details", "Confirmed"] as const;
type StepName = "schedule" | "details" | "done";
const STEP_INDEX: Record<StepName, number> = { schedule: 0, details: 1, done: 2 };

type FormValues = {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  consent: boolean;
};

const EMPTY_VALUES: FormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  notes: "",
  consent: false,
};

export function BookingFlow() {
  const reduced = useReducedMotion();
  const [state, formAction, pending] = useActionState(submitBooking, INITIAL_BOOKING_STATE);

  const [step, setStep] = React.useState<StepName>("schedule");
  const [selectedStart, setSelectedStart] = React.useState<number | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  // React 19 resets uncontrolled inputs after a server-action submission — even
  // on validation errors — which would wipe what the user typed. Holding the
  // values in state keeps them through an error round-trip; the form is
  // replaced by the confirmation on success, so no manual clear is needed.
  const [values, setValues] = React.useState<FormValues>(EMPTY_VALUES);
  const set = <K extends keyof FormValues>(key: K, val: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  React.useEffect(() => {
    if (state.status === "success") setStep("done");
  }, [state.status]);

  const fieldErrors: BookingFieldErrors =
    state.status === "error" ? state.fieldErrors ?? {} : {};

  const activeIndex = STEP_INDEX[step];

  return (
    <div className="mx-auto w-full max-w-xl">
      <ProgressRail activeIndex={activeIndex} />

      <div className="mt-8 rounded-card border border-border bg-surface/40 p-6 md:p-8">
        <AnimatePresence mode="wait" initial={false}>
          {step === "schedule" ? (
            <motion.div
              key="schedule"
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <AvailabilityPicker
                selectedStart={selectedStart}
                onSelectStart={(s, day) => {
                  setSelectedStart(s);
                  setSelectedDate(day);
                }}
              />
              <button
                type="button"
                disabled={selectedStart === null}
                onClick={() => setStep("details")}
                className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-orange px-6 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          ) : null}

          {step === "details" ? (
            <motion.div
              key="details"
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {selectedStart !== null && selectedDate ? (
                <SelectedSlotBadge startUtc={selectedStart} />
              ) : null}

              <form action={formAction} className="mt-5 flex flex-col gap-4" noValidate>
                {state.status === "error" && !state.fieldErrors ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger"
                  >
                    {state.message}
                  </div>
                ) : null}

                <input type="hidden" name="startUtc" value={selectedStart ?? ""} readOnly />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <BookingField
                    label="Name"
                    name="name"
                    required
                    autoComplete="name"
                    value={values.name}
                    onChange={(v) => set("name", v)}
                    error={fieldErrors.name?.[0]}
                  />
                  <BookingField
                    label="Email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={values.email}
                    onChange={(v) => set("email", v)}
                    error={fieldErrors.email?.[0]}
                  />
                  <BookingField
                    label="Phone (optional)"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={values.phone}
                    onChange={(v) => set("phone", v)}
                    error={fieldErrors.phone?.[0]}
                  />
                  <BookingField
                    label="Company (optional)"
                    name="company"
                    autoComplete="organization"
                    value={values.company}
                    onChange={(v) => set("company", v)}
                    error={fieldErrors.company?.[0]}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="notes" className={labelBase}>
                    What would you like to discuss? (optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    maxLength={1000}
                    value={values.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="A sentence or two about your business and what you're hoping to achieve."
                    className={cn(inputBase, "resize-y")}
                  />
                </div>

                <label className="flex items-start gap-2.5 text-xs text-muted">
                  <input
                    type="checkbox"
                    name="consent"
                    required
                    checked={values.consent}
                    onChange={(e) => set("consent", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border bg-ink/40 accent-brand-orange"
                  />
                  <span>
                    I agree to be contacted about this call. Read our{" "}
                    <a href="/privacy" className="text-brand-orange hover:underline">
                      privacy policy
                    </a>
                    .
                  </span>
                </label>
                {fieldErrors.consent?.[0] ? (
                  <p className="-mt-2 text-xs text-danger">{fieldErrors.consent[0]}</p>
                ) : null}

                {/* Honeypot */}
                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

                <div className="mt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("schedule")}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border-strong px-5 text-sm font-medium text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-orange px-6 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:cursor-wait disabled:opacity-70"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Booking…
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="h-4 w-4" />
                        Confirm booking
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : null}

          {step === "done" && state.status === "success" ? (
            <motion.div
              key="done"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-5 py-4 text-center"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <div className="flex flex-col gap-1.5">
                <h2 className="font-display text-2xl font-semibold text-foreground">You're booked.</h2>
                <p className="text-sm text-muted">{state.message} A confirmation is on its way to your inbox.</p>
              </div>

              <div className="w-full rounded-xl border border-border bg-ink/40 p-5 text-left">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-2">Discovery call</p>
                <p className="mt-1.5 font-display text-lg font-semibold text-foreground">
                  {formatBookingWhen(state.booking.startUtc, state.booking.endUtc, state.booking.timezone)}
                </p>
                {state.booking.meetLink ? (
                  <a
                    href={state.booking.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow"
                  >
                    <Video className="h-4 w-4" />
                    Join Google Meet
                  </a>
                ) : (
                  <p className="mt-3 text-xs text-muted">
                    We'll email you the meeting link shortly.
                  </p>
                )}
              </div>

              <a
                href={`/book/manage/${state.booking.manageToken}`}
                className="text-sm font-medium text-muted hover:text-brand-orange"
              >
                Need to change it? Reschedule or cancel →
              </a>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SelectedSlotBadge({ startUtc }: { startUtc: number }) {
  // We don't know the business tz on the client until confirmation, so show
  // the slot in the viewer's local time here — it's just a recap of their pick.
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <div className="inline-flex items-center gap-2 rounded-pill border border-brand-orange/40 bg-brand-orange/10 px-3.5 py-1.5 text-xs font-medium text-brand-orange">
      <CalendarCheck className="h-3.5 w-3.5" />
      {formatBookingDay(startUtc, tz)} · {formatBookingTime(startUtc, tz)}
    </div>
  );
}

function ProgressRail({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex items-center gap-3">
      {STEPS.map((label, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full text-xs font-semibold transition-colors",
                  active && "bg-brand-orange text-white",
                  done && "bg-brand-orange/20 text-brand-orange",
                  !active && !done && "bg-surface-2 text-muted-2",
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:inline",
                  active ? "text-foreground" : "text-muted-2",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <span
                className={cn(
                  "h-px flex-1 transition-colors",
                  i < activeIndex ? "bg-brand-orange/40" : "bg-border",
                )}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function BookingField({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className={labelBase}>
        {label}
        {required ? <span className="ml-1 text-brand-orange">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
