// ----------------------------------------------------------------------------
// Availability rules — the owner's bookable-hours configuration. The shape is
// shared; per-client defaults (timezone + meeting title) come from BrandConfig
// so a new client site is bookable out of the box before the admin edits them.
// ----------------------------------------------------------------------------

export type Rules = {
  timezone: string;
  weeklyHours: { weekday: number; start: string; end: string }[];
  slotMinutes: number;
  durationMinutes: number;
  bufferBefore: number;
  bufferAfter: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  meetingTitle: string;
};

export type DefaultRulesInput = {
  timezone: string;
  meetingTitle: string;
};

/**
 * Sensible out-of-the-box rules: Mon–Fri 9–4, 30-minute slots, no buffers, 12h
 * notice, 21 days ahead. `timezone` and `meetingTitle` are client-specific and
 * come from the site's BrandConfig.
 */
export function makeDefaultRules({ timezone, meetingTitle }: DefaultRulesInput): Rules {
  return {
    timezone,
    weeklyHours: [
      { weekday: 1, start: "09:00", end: "16:00" },
      { weekday: 2, start: "09:00", end: "16:00" },
      { weekday: 3, start: "09:00", end: "16:00" },
      { weekday: 4, start: "09:00", end: "16:00" },
      { weekday: 5, start: "09:00", end: "16:00" },
    ],
    slotMinutes: 30,
    durationMinutes: 30,
    // No padding by default, so consecutive calls are bookable back-to-back
    // (a 9:00–9:30 booking leaves 9:30–10:00 open). The admin can add buffers
    // later if breathing room between calls is wanted.
    bufferBefore: 0,
    bufferAfter: 0,
    minNoticeHours: 12,
    maxAdvanceDays: 21,
    meetingTitle,
  };
}
