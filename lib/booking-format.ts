// Shared formatting for booking times. Pure (Intl only) so it works the same
// on the server (emails) and the client (confirmation screen).

/** "Tuesday, June 3, 2026" in the given IANA timezone. */
export function formatBookingDay(epochMs: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(epochMs));
}

/** "9:00 AM" in the given timezone. */
export function formatBookingTime(epochMs: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(epochMs));
}

function tzAbbreviation(epochMs: number, timeZone: string): string {
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
    .formatToParts(new Date(epochMs))
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? "";
}

/** "Tuesday, June 3, 2026 · 9:00–9:30 AM EDT" */
export function formatBookingWhen(startUtc: number, endUtc: number, timeZone: string): string {
  const day = formatBookingDay(startUtc, timeZone);
  const start = formatBookingTime(startUtc, timeZone);
  const end = formatBookingTime(endUtc, timeZone);
  const abbr = tzAbbreviation(startUtc, timeZone);
  return `${day} · ${start}–${end}${abbr ? ` ${abbr}` : ""}`;
}
