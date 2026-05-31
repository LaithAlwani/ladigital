import "server-only";
import { render } from "@react-email/components";
import { sendMail } from "@/lib/mailer";
import { siteConfig } from "@/lib/site-config";
import BookingEmail from "@/emails/booking-email";

/** Public site base URL (for manage links in emails). */
export function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || siteConfig.seo.siteUrl;
}

/** Send the client + owner emails for a booking event. Best-effort, non-blocking. */
export async function sendBookingEmails(opts: {
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
        subject: `Booking ${verb} — ${opts.name}`,
        html: ownerHtml,
      }),
    ]);
  } catch (err) {
    console.error("[booking] email send failed (non-blocking):", err);
  }
}
