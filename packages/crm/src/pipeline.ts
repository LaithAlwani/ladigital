// ----------------------------------------------------------------------------
// Pipeline config + pure helpers — token-styled (Tailwind `@theme` classes) so
// the board re-themes per client with no code changes.
// ----------------------------------------------------------------------------

export type DealStage = "new" | "contacted" | "qualified" | "won" | "lost";

export type StageDef = {
  value: DealStage;
  label: string;
  /** Badge/accent classes, driven by theme tokens. */
  badge: string;
  /** Column header dot color. */
  dot: string;
};

// Order here is the left→right column order on the board.
export const PIPELINE_STAGES: StageDef[] = [
  { value: "new", label: "New", badge: "border-border bg-surface-2 text-muted", dot: "bg-muted-2" },
  {
    value: "contacted",
    label: "Contacted",
    badge: "border-brand-orange/30 bg-brand-orange/10 text-brand-orange",
    dot: "bg-brand-orange",
  },
  {
    value: "qualified",
    label: "Qualified",
    badge: "border-brand-orange/40 bg-brand-orange/15 text-brand-orange",
    dot: "bg-brand-orange",
  },
  { value: "won", label: "Won", badge: "border-success/30 bg-success/10 text-success", dot: "bg-success" },
  { value: "lost", label: "Lost", badge: "border-danger/30 bg-danger/10 text-danger", dot: "bg-danger" },
];

export const STAGE_MAP = Object.fromEntries(
  PIPELINE_STAGES.map((s) => [s.value, s]),
) as Record<DealStage, StageDef>;

/** The open (still-in-play) stages, left→right. */
export const OPEN_STAGES: DealStage[] = ["new", "contacted", "qualified"];

/** Stage immediately to the left/right, or null at the ends. */
export function adjacentStage(stage: DealStage, dir: -1 | 1): DealStage | null {
  const order = PIPELINE_STAGES.map((s) => s.value);
  const i = order.indexOf(stage);
  const j = i + dir;
  if (j < 0 || j >= order.length) return null;
  return order[j];
}

export type DealLike = { stage: DealStage; value?: number };

/** Sum of expected value across the open stages (a simple pipeline forecast). */
export function openPipelineValue(deals: DealLike[]): number {
  return deals
    .filter((d) => OPEN_STAGES.includes(d.stage))
    .reduce((sum, d) => sum + (Number(d.value) || 0), 0);
}
