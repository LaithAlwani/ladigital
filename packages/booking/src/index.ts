// @ladigital/booking — pure, DB-free booking cores (timezone math, availability
// rules, slot generation + verification). The per-app Convex layer supplies the
// blockers and registers the query/mutation wrappers; this package is where the
// logic lives so each client drops it in and only themes the surface.
export {
  zonedWallTimeToUtc,
  weekdayOf,
  addDays,
  toDateStr,
  toTimeLabel,
  parseHm,
  overlaps,
} from "./time";
export { makeDefaultRules } from "./rules";
export type { Rules, DefaultRulesInput } from "./rules";
export {
  MS,
  slotIsFree,
  candidateSlots,
  computeDaySlots,
  verifyOpenCore,
} from "./slots";
export type { Blockers, DaySlots, VerifyResult } from "./slots";
