import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { formatBookingWhen } from "@/lib/booking-format";
import { siteBase, sendBookingReminderEmail } from "@/lib/booking-emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOUR = 60 * 60 * 1000;

// Emails a reminder for each upcoming discovery call within the look-ahead
// window that hasn't been reminded yet, then marks it reminded (once, via
// reminderSentAt). Triggered by the Vercel cron (daily — see vercel.json), or
// manually:  GET /api/cron/booking-reminders?secret=$CRON_SECRET[&withinHours=48]
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  return auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const adminKey = process.env.ADMIN_WRITE_KEY ?? "";
  const url = new URL(req.url);
  // Daily cron + a wide window means every booking is reminded once, ~1–2 days
  // ahead. Tunable per-request (1h–7d) for manual runs.
  const withinHours = Math.min(Math.max(Number(url.searchParams.get("withinHours")) || 48, 1), 168);

  const results: { name: string; when: string; emailed: boolean; note?: string }[] = [];

  try {
    const due = await fetchQuery(api.bookings.dueForReminder, {
      adminKey,
      withinMs: withinHours * HOUR,
    });
    if (due.length === 0) return Response.json({ ok: true, reminded: 0, results });

    const rules = await fetchQuery(api.availability.getRules, {});
    const tz = rules.timezone;

    for (const b of due) {
      const whenText = formatBookingWhen(b.startUtc, b.endUtc, tz);
      let emailed = false;
      let note: string | undefined;
      try {
        const r = await sendBookingReminderEmail({
          name: b.name,
          email: b.email,
          whenText,
          meetLink: b.meetLink ?? undefined,
          manageUrl: `${siteBase()}/book/manage/${b.manageToken}`,
        });
        if (r.ok && !r.skipped) {
          emailed = true;
          // Only mark reminded when the email actually went out, so a missing
          // SMTP config retries on the next run instead of silently skipping.
          await fetchMutation(api.bookings.markReminded, { adminKey, id: b._id });
        } else {
          note = r.skipped ? "SMTP not configured" : "send failed";
        }
      } catch (err) {
        note = err instanceof Error ? err.message : "email failed";
      }
      results.push({ name: b.name, when: whenText, emailed, note });
    }

    return Response.json({ ok: true, reminded: results.filter((r) => r.emailed).length, results });
  } catch (err) {
    console.error("[cron/booking-reminders]", err);
    return new Response(JSON.stringify({ ok: false, error: "cron_failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
