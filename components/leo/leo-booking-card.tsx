"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, Video, CalendarCheck } from "lucide-react";
import { submitBooking } from "@/app/actions/booking";
import { INITIAL_BOOKING_STATE } from "@/lib/schemas";
import { AvailabilityPicker } from "@/components/booking/availability-picker";
import { formatBookingWhen } from "@/lib/booking-format";
import { leoStrings, type Locale } from "@/lib/leo-strings";

const inputCls =
  "w-full rounded-lg border border-border bg-ink/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-2 focus:border-brand-orange focus:outline-none disabled:opacity-60";

export function LeoBookingCard({ locale }: { locale: Locale }) {
  const t = leoStrings(locale).booking;
  const [state, formAction, pending] = useActionState(submitBooking, INITIAL_BOOKING_STATE);
  const [selectedStart, setSelectedStart] = useState<number | null>(null);

  if (state.status === "success") {
    return (
      <div className="ml-9 flex flex-col gap-1.5 rounded-card border border-success/40 bg-success/10 p-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckCircle2 className="h-4 w-4 flex-none text-success" />
          {t.successTitle}
        </div>
        <p className="text-sm text-foreground">
          {formatBookingWhen(state.booking.startUtc, state.booking.endUtc, state.booking.timezone)}
        </p>
        {state.booking.meetLink ? (
          <a
            href={state.booking.meetLink}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-orange-soft"
          >
            <Video className="h-3.5 w-3.5" />
            {t.join}
          </a>
        ) : (
          <p className="text-xs text-muted">{t.successBody}</p>
        )}
        <a
          href={`/book/manage/${state.booking.manageToken}`}
          className="mt-1 text-xs text-muted hover:text-brand-orange"
        >
          {t.manage} →
        </a>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="ml-9 flex flex-col gap-3 rounded-card border border-brand-orange/40 bg-brand-orange/8 p-3"
    >
      <AvailabilityPicker selectedStart={selectedStart} onSelectStart={(s) => setSelectedStart(s)} />

      <input type="hidden" name="startUtc" value={selectedStart ?? ""} readOnly />
      <input name="name" required placeholder={t.namePlaceholder} autoComplete="name" className={inputCls} />
      <input
        name="email"
        type="email"
        required
        placeholder={t.emailPlaceholder}
        autoComplete="email"
        className={inputCls}
      />
      <label className="flex items-start gap-2 text-[11px] leading-snug text-muted">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 h-3.5 w-3.5 flex-none rounded border-border bg-ink/60 accent-brand-orange"
        />
        <span>
          {t.consent}{" "}
          <a href="/privacy" className="text-brand-orange hover:underline">
            Privacy
          </a>
        </span>
      </label>

      {/* Honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      {state.status === "error" ? <p className="text-xs text-danger">{state.message}</p> : null}

      <button
        type="submit"
        disabled={!selectedStart || pending}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-orange px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-orange-soft disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t.submitting}
          </>
        ) : (
          <>
            <CalendarCheck className="h-3.5 w-3.5" />
            {t.submit}
          </>
        )}
      </button>
      {!selectedStart ? (
        <p className="text-center text-[11px] text-muted-2">{t.choosePrompt}</p>
      ) : null}
    </form>
  );
}
