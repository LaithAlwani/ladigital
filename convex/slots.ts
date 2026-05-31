import { query, type QueryCtx } from "./_generated/server";
import { effectiveRules, type Rules } from "./availability";
import {
  addDays,
  overlaps,
  parseHm,
  toDateStr,
  toTimeLabel,
  weekdayOf,
  zonedWallTimeToUtc,
} from "./lib/time";

// ----------------------------------------------------------------------------
// Availability — the single source of bookable slots. The booking page calls
// `list` reactively (a slot taken elsewhere disappears live); the booking
// mutation reuses `verifyOpen` for an authoritative re-check inside its
// transaction so two clients can't grab the same slot.
// ----------------------------------------------------------------------------

const MS = { hour: 3_600_000, day: 86_400_000, minute: 60_000 };

type Blockers = {
  bookings: { startUtc: number; endUtc: number }[];
  busy: { startUtc: number; endUtc: number }[];
  blackout: Set<string>;
};

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

/** Is a candidate [start,end] free of all blockers (with buffers around bookings)? */
function slotIsFree(start: number, end: number, rules: Rules, blockers: Blockers): boolean {
  const padBefore = rules.bufferBefore * MS.minute;
  const padAfter = rules.bufferAfter * MS.minute;
  for (const b of blockers.bookings) {
    if (overlaps(start, end, b.startUtc - padBefore, b.endUtc + padAfter)) return false;
  }
  for (const b of blockers.busy) {
    if (overlaps(start, end, b.startUtc, b.endUtc)) return false;
  }
  return true;
}

/** Generate the candidate slot start-instants for one calendar day. */
function candidateSlots(dateStr: string, rules: Rules): { start: number; end: number }[] {
  const wd = weekdayOf(dateStr);
  const windows = rules.weeklyHours.filter((w) => w.weekday === wd);
  const out: { start: number; end: number }[] = [];
  const dur = rules.durationMinutes;
  for (const w of windows) {
    const s = parseHm(w.start);
    const e = parseHm(w.end);
    const startMin = s.hour * 60 + s.minute;
    const endMin = e.hour * 60 + e.minute;
    for (let t = startMin; t + dur <= endMin; t += rules.slotMinutes) {
      const start = zonedWallTimeToUtc(dateStr, Math.floor(t / 60), t % 60, rules.timezone);
      out.push({ start, end: start + dur * MS.minute });
    }
  }
  return out;
}

export type DaySlots = {
  date: string; // YYYY-MM-DD
  slots: { startUtc: number; endUtc: number; label: string }[];
};

/** Day-rail data: one entry per working day in the bookable window. */
export const list = query({
  args: {},
  handler: async (ctx): Promise<DaySlots[]> => {
    const rules = await effectiveRules(ctx);
    const tz = rules.timezone;
    const now = Date.now();
    const todayStr = toDateStr(now, tz);
    const earliest = now + rules.minNoticeHours * MS.hour;

    const winStart = now;
    const winEnd = now + (rules.maxAdvanceDays + 1) * MS.day;
    const blockers = await gatherBlockers(ctx, winStart, winEnd);

    const days: DaySlots[] = [];
    for (let i = 0; i <= rules.maxAdvanceDays; i++) {
      const date = addDays(todayStr, i);
      if (blockers.blackout.has(date)) continue;
      const candidates = candidateSlots(date, rules);
      if (candidates.length === 0) continue; // not a working day
      const slots = candidates
        .filter((c) => c.start >= earliest && slotIsFree(c.start, c.end, rules, blockers))
        .map((c) => ({ startUtc: c.start, endUtc: c.end, label: toTimeLabel(c.start, tz) }));
      days.push({ date, slots });
    }
    return days;
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
  const tz = rules.timezone;
  const now = Date.now();
  const date = toDateStr(startUtc, tz);
  const endUtc = startUtc + rules.durationMinutes * MS.minute;

  if (startUtc < now + rules.minNoticeHours * MS.hour) {
    return { ok: false, endUtc, rules, reason: "Too soon — please pick a later time." };
  }
  if (startUtc > now + (rules.maxAdvanceDays + 1) * MS.day) {
    return { ok: false, endUtc, rules, reason: "That date is too far out." };
  }

  // Must align with a generated candidate for that day.
  const candidates = candidateSlots(date, rules);
  if (!candidates.some((c) => c.start === startUtc)) {
    return { ok: false, endUtc, rules, reason: "That time isn't available." };
  }

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
  if (blockers.blackout.has(date)) {
    return { ok: false, endUtc, rules, reason: "That day is unavailable." };
  }
  if (!slotIsFree(startUtc, endUtc, rules, blockers)) {
    return { ok: false, endUtc, rules, reason: "That slot was just taken." };
  }
  return { ok: true, endUtc, rules };
}
