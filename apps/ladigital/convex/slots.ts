import { query, type QueryCtx } from "./_generated/server";
import { effectiveRules } from "./availability";
import { addDays } from "./lib/time";
import {
  MS,
  computeDaySlots,
  verifyOpenCore,
  type Blockers,
  type DaySlots,
  type Rules,
  type VerifyResult,
} from "@ladigital/booking";

// ----------------------------------------------------------------------------
// Availability — the DB layer over @ladigital/booking's pure slot math. The
// booking page calls `list` reactively (a slot taken elsewhere disappears
// live); the booking mutation reuses `verifyOpen` for an authoritative re-check
// inside its transaction so two clients can't grab the same slot.
// ----------------------------------------------------------------------------

export type { DaySlots };

/** Load everything that can block a slot inside [winStart, winEnd]. */
async function gatherBlockers(
  ctx: QueryCtx,
  winStart: number,
  winEnd: number,
): Promise<Blockers> {
  const bookingDocs = await ctx.db
    .query("bookings")
    .withIndex("by_start", (q) => q.gte("startUtc", winStart).lte("startUtc", winEnd))
    .collect();
  const bookings = bookingDocs
    .filter((b) => b.status !== "cancelled")
    .map((b) => ({ startUtc: b.startUtc, endUtc: b.endUtc }));

  // googleBusy is indexed by start; a busy block could start before the window
  // yet still overlap it, so widen the lower bound and filter by end in JS.
  const busyDocs = await ctx.db
    .query("googleBusy")
    .withIndex("by_start", (q) => q.lte("startUtc", winEnd))
    .collect();
  const busy = busyDocs
    .filter((b) => b.endUtc > winStart)
    .map((b) => ({ startUtc: b.startUtc, endUtc: b.endUtc }));

  const blackoutDocs = await ctx.db.query("blackoutDates").collect();
  const blackout = new Set<string>();
  for (const b of blackoutDocs) {
    let d = b.startDate;
    // Expand inclusive ranges into individual day strings (ranges are short).
    for (let i = 0; i < 366 && d <= b.endDate; i++) {
      blackout.add(d);
      d = addDays(d, 1);
    }
  }
  return { bookings, busy, blackout };
}

/** Day-rail data: one entry per working day in the bookable window. */
export const list = query({
  args: {},
  handler: async (ctx): Promise<DaySlots[]> => {
    const rules = await effectiveRules(ctx);
    const now = Date.now();
    const winStart = now;
    const winEnd = now + (rules.maxAdvanceDays + 1) * MS.day;
    const blockers = await gatherBlockers(ctx, winStart, winEnd);
    return computeDaySlots(rules, blockers, now);
  },
});

/**
 * Authoritative check that `startUtc` is a real, currently-open slot. Reused by
 * the booking mutations inside their transaction. `ignoreBookingId` lets a
 * reschedule disregard the booking being moved.
 */
export async function verifyOpen(
  ctx: QueryCtx,
  startUtc: number,
  ignoreBookingId?: string,
): Promise<{ ok: boolean; endUtc: number; rules: Rules; reason?: string }> {
  const rules = await effectiveRules(ctx);
  const endUtc = startUtc + rules.durationMinutes * MS.minute;
  const blockers = await gatherBlockers(ctx, startUtc - MS.day, endUtc + MS.day);

  if (ignoreBookingId) {
    // Remove the booking being rescheduled from consideration.
    const moving = await ctx.db.normalizeId("bookings", ignoreBookingId);
    if (moving) {
      const doc = await ctx.db.get(moving);
      if (doc) {
        blockers.bookings = blockers.bookings.filter(
          (b) => !(b.startUtc === doc.startUtc && b.endUtc === doc.endUtc),
        );
      }
    }
  }

  const res: VerifyResult = verifyOpenCore(rules, blockers, startUtc, Date.now());
  return { ...res, rules };
}
