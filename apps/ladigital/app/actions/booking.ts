"use server";

import { fetchAction, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import {
  bookingSchema,
  type BookingActionState,
  type BookingFieldErrors,
} from "@/lib/schemas";
import { formatBookingWhen } from "@/lib/booking-format";
import { siteBase, sendBookingEmails } from "@/lib/booking-emails";

export async function submitBooking(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;

  const parsed = bookingSchema.safeParse({
    name: raw.name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    company: raw.company ?? "",
    notes: raw.notes ?? "",
    startUtc: raw.startUtc ?? "",
    website: raw.website ?? "",
    consent: raw.consent === "on" || raw.consent === "true",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as BookingFieldErrors,
    };
  }

  // Honeypot tripped — pretend success without booking.
  if (parsed.data.website) {
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }

  const data = parsed.data;

  let result;
  try {
    result = await fetchAction(api.bookings.book, {
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      company: data.company || undefined,
      notes: data.notes || undefined,
      startUtc: data.startUtc,
      source: "web",
    });
  } catch (err) {
    console.error("[booking] book action failed:", err);
    return { status: "error", message: "We couldn't reach the scheduler. Please try again." };
  }

  if (!result.ok) {
    return { status: "error", message: result.reason };
  }

  const rules = await fetchQuery(api.availability.getRules, {});
  const tz = rules.timezone;
  const whenText = formatBookingWhen(result.startUtc, result.endUtc, tz);
  const manageUrl = `${siteBase()}/book/manage/${result.manageToken}`;

  await sendBookingEmails({
    kind: "confirmed",
    name: data.name,
    email: data.email,
    phone: data.phone || undefined,
    company: data.company || undefined,
    notes: data.notes || undefined,
    whenText,
    meetLink: result.meetLink,
    manageUrl,
  });

  return {
    status: "success",
    message: "Your discovery call is booked.",
    booking: {
      startUtc: result.startUtc,
      endUtc: result.endUtc,
      timezone: tz,
      manageToken: result.manageToken,
      meetLink: result.meetLink,
      calendarConnected: result.calendarConnected,
    },
  };
}

export type ManageResult =
  | { ok: true; message: string; startUtc?: number; endUtc?: number; meetLink?: string }
  | { ok: false; message: string };

export async function rescheduleBooking(token: string, startUtc: number): Promise<ManageResult> {
  let res;
  try {
    res = await fetchAction(api.bookings.rebook, { token, startUtc });
  } catch (err) {
    console.error("[booking] rebook failed:", err);
    return { ok: false, message: "We couldn't reschedule. Please try again." };
  }
  if (!res.ok) return { ok: false, message: res.reason };

  const [booking, rules] = await Promise.all([
    fetchQuery(api.bookings.getByToken, { token }),
    fetchQuery(api.availability.getRules, {}),
  ]);
  const tz = rules.timezone;
  if (booking) {
    await sendBookingEmails({
      kind: "rescheduled",
      name: booking.name,
      email: booking.email,
      phone: booking.phone ?? undefined,
      company: booking.company ?? undefined,
      notes: booking.notes ?? undefined,
      whenText: formatBookingWhen(res.startUtc, res.endUtc, tz),
      previousWhenText: formatBookingWhen(
        res.previousStartUtc,
        res.previousStartUtc + (res.endUtc - res.startUtc),
        tz,
      ),
      meetLink: booking.meetLink ?? undefined,
      manageUrl: `${siteBase()}/book/manage/${token}`,
    });
  }

  return {
    ok: true,
    message: "Your call has been rescheduled.",
    startUtc: res.startUtc,
    endUtc: res.endUtc,
    meetLink: booking?.meetLink ?? undefined,
  };
}

export async function cancelBooking(token: string): Promise<ManageResult> {
  // Read details before cancelling so the email has the person + time.
  const [booking, rules] = await Promise.all([
    fetchQuery(api.bookings.getByToken, { token }),
    fetchQuery(api.availability.getRules, {}),
  ]);

  let res;
  try {
    res = await fetchAction(api.bookings.unbook, { token });
  } catch (err) {
    console.error("[booking] unbook failed:", err);
    return { ok: false, message: "We couldn't cancel. Please try again." };
  }
  if (!res.ok) return { ok: false, message: res.reason };

  if (booking) {
    await sendBookingEmails({
      kind: "cancelled",
      name: booking.name,
      email: booking.email,
      whenText: formatBookingWhen(
        booking.startUtc,
        booking.endUtc,
        rules.timezone,
      ),
    });
  }

  return { ok: true, message: "Your call has been cancelled." };
}
