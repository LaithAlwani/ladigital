// ----------------------------------------------------------------------------
// Timezone-aware date helpers — pure, default-runtime safe (only Date + Intl).
// Shared by the slot query and the booking mutations so availability math and
// the transactional re-check agree exactly. All instants are epoch ms (UTC).
// ----------------------------------------------------------------------------

/** Milliseconds to add to a UTC instant to get wall-clock time in `timeZone`. */
function offsetMs(timeZone: string, utc: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(utc)) p[part.type] = part.value;
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return asUtc - utc.getTime();
}

/**
 * Convert a wall-clock date + time in `timeZone` to a UTC epoch-ms instant.
 * Refines once to stay correct across DST boundaries.
 */
export function zonedWallTimeToUtc(
  dateStr: string,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const naive = Date.UTC(y, mo - 1, d, hour, minute);
  const off1 = offsetMs(timeZone, new Date(naive));
  let utc = naive - off1;
  const off2 = offsetMs(timeZone, new Date(utc));
  if (off2 !== off1) utc = naive - off2;
  return utc;
}

/** Weekday (0=Sun … 6=Sat) for a "YYYY-MM-DD" calendar date. */
export function weekdayOf(dateStr: string): number {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

/** Add `n` days to a "YYYY-MM-DD" date, returning "YYYY-MM-DD". */
export function addDays(dateStr: string, n: number): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d + n));
  return toDateStr(dt.getTime(), "UTC");
}

/** The "YYYY-MM-DD" calendar date of an instant, as seen in `timeZone`. */
export function toDateStr(epochMs: number, timeZone: string): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA formats as YYYY-MM-DD.
  return dtf.format(new Date(epochMs));
}

/** "9:00 AM" style label of an instant in `timeZone`. */
export function toTimeLabel(epochMs: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(epochMs));
}

/** Parse "HH:MM" → { hour, minute }. */
export function parseHm(hm: string): { hour: number; minute: number } {
  const [h, m] = hm.split(":").map(Number);
  return { hour: h, minute: m };
}

/** Two intervals [aStart,aEnd) and [bStart,bEnd) overlap? */
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}
