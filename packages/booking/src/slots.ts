import type { Rules } from "./rules";
import {
  addDays,
  overlaps,
  parseHm,
  toDateStr,
  toTimeLabel,
  weekdayOf,
  zonedWallTimeToUtc,
} from "./time";

// ----------------------------------------------------------------------------
// Pure slot math — the single source of bookable slots, with zero DB access.
// The Convex layer gathers the blockers (existing bookings, Google-busy blocks,
// blackout days) from the deployment and hands them here, so the reactive slot
// query and the transactional re-check agree exactly. See the app's
// convex/slots.ts for the thin DB wrappers.
// ----------------------------------------------------------------------------

export const MS = { hour: 3_600_000, day: 86_400_000, minute: 60_000 };

export type Blockers = {
  bookings: { startUtc: number; endUtc: number }[];
  busy: { startUtc: number; endUtc: number }[];
  blackout: Set<string>;
};

/** Is a candidate [start,end] free of all blockers (with buffers around bookings)? */
export function slotIsFree(
  start: number,
  end: number,
  rules: Rules,
  blockers: Blockers,
): boolean {
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
export function candidateSlots(
  dateStr: string,
  rules: Rules,
): { start: number; end: number }[] {
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

/** Day-rail data: one entry per working day in the bookable window. Pure. */
export function computeDaySlots(rules: Rules, blockers: Blockers, now: number): DaySlots[] {
  const tz = rules.timezone;
  const todayStr = toDateStr(now, tz);
  const earliest = now + rules.minNoticeHours * MS.hour;

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
}

export type VerifyResult = { ok: boolean; endUtc: number; reason?: string };

/**
 * Authoritative check that `startUtc` is a real, currently-open slot, given
 * pre-gathered blockers. Pure — the Convex wrapper loads blockers (already
 * excluding any booking being rescheduled) and attaches the rules to the result.
 */
export function verifyOpenCore(
  rules: Rules,
  blockers: Blockers,
  startUtc: number,
  now: number,
): VerifyResult {
  const tz = rules.timezone;
  const date = toDateStr(startUtc, tz);
  const endUtc = startUtc + rules.durationMinutes * MS.minute;

  if (startUtc < now + rules.minNoticeHours * MS.hour) {
    return { ok: false, endUtc, reason: "Too soon — please pick a later time." };
  }
  if (startUtc > now + (rules.maxAdvanceDays + 1) * MS.day) {
    return { ok: false, endUtc, reason: "That date is too far out." };
  }

  // Must align with a generated candidate for that day.
  const candidates = candidateSlots(date, rules);
  if (!candidates.some((c) => c.start === startUtc)) {
    return { ok: false, endUtc, reason: "That time isn't available." };
  }
  if (blockers.blackout.has(date)) {
    return { ok: false, endUtc, reason: "That day is unavailable." };
  }
  if (!slotIsFree(startUtc, endUtc, rules, blockers)) {
    return { ok: false, endUtc, reason: "That slot was just taken." };
  }
  return { ok: true, endUtc };
}
