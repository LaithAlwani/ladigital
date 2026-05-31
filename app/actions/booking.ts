"use server";

import { render } from "@react-email/components";
import { fetchAction, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import {
  bookingSchema,
  type BookingActionState,
  type BookingFieldErrors,
} from "@/lib/schemas";
import { sendMail } from "@/lib/mailer";
import { siteConfig } from "@/lib/site-config";
import { formatBookingWhen } from "@/lib/booking-format";
import BookingEmail from "@/emails/booking-email";

function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || siteConfig.seo.siteUrl;
}

/** Send the client + owner emails for a booking event. Best-effort, non-blocking. */
async function sendBookingEmails(opts: {
  kind: "confirmed" | "rescheduled" | "cancelled";
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  whenText: string;
  previousWhenText?: string;
  meetLink?: string;
  manageUrl?: string;
}) {
  try {
    const [clientHtml, ownerHtml] = await Promise.all([
      render(
        BookingEmail({
          kind: opts.kind,
          role: "client",
          name: opts.name,
          whenText: opts.whenText,
          previousWhenText: opts.previousWhenText,
          meetLink: opts.meetLink,
          manageUrl: opts.manageUrl,
        }),
      ),
      render(
        BookingEmail({
          kind: opts.kind,
          role: "owner",
          name: opts.name,
          whenText: opts.whenText,
          previousWhenText: opts.previousWhenText,
          meetLink: opts.meetLink,
          email: opts.email,
          phone: opts.phone,
          company: opts.company,
          notes: opts.notes,
        }),
      ),
    ]);
    const subjectName = opts.name;
    const verb =
      opts.kind === "confirmed" ? "confirmed" : opts.kind === "rescheduled" ? "rescheduled" : "cancelled";
    await Promise.all([
      sendMail({
        to: opts.email,
        replyTo: siteConfig.contact.email,
        subject: `Your discovery call is ${verb} — ${siteConfig.company.name}`,
        html: clientHtml,
      }),
      sendMail({
        to: siteConfig.mail.toEmail,
        replyTo: opts.email,
        subject: `Booking ${verb} — ${subjectName}`,
        html: ownerHtml,
      }),
    ]);
  } catch (err) {
    console.error("[booking] email send failed (non-blocking):", err);
  }
}

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
