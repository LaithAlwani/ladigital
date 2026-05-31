// Project status metadata — shared by the admin editor (dropdown) and the
// public site (badges). `showsLink` controls whether the external URL is
// surfaced as a clickable link.

export const PROJECT_STATUSES = [
  {
    value: "live",
    label: "Live",
    short: "Live",
    showsLink: true,
    badge: "border-success/30 bg-success/10 text-success",
    dot: "bg-success",
  },
  {
    value: "under-construction",
    label: "Under construction",
    short: "Building",
    showsLink: false,
    badge: "border-brand-orange/30 bg-brand-orange/10 text-brand-orange",
    dot: "bg-brand-orange",
  },
  {
    value: "legacy",
    label: "Legacy",
    short: "Legacy",
    showsLink: true,
    badge: "border-border-strong bg-surface-2 text-muted",
    dot: "bg-muted",
  },
  {
    value: "retired",
    label: "No longer exists",
    short: "Retired",
    showsLink: false,
    badge: "border-border bg-ink/40 text-muted-2",
    dot: "bg-muted-2",
  },
  {
    value: "private",
    label: "No public access",
    short: "Private",
    showsLink: false,
    badge: "border-border-strong bg-surface-2 text-muted",
    dot: "bg-muted-2",
  },
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];

export const STATUS_MAP: Record<ProjectStatus, (typeof PROJECT_STATUSES)[number]> =
  Object.fromEntries(PROJECT_STATUSES.map((s) => [s.value, s])) as Record<
    ProjectStatus,
    (typeof PROJECT_STATUSES)[number]
  >;
