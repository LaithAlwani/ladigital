import { STATUS_MAP, type ProjectStatus } from "@/lib/project-status";
import { cn } from "@/lib/cn";

export function StatusBadge({
  status,
  className,
  full,
}: {
  status: ProjectStatus;
  className?: string;
  full?: boolean;
}) {
  const s = STATUS_MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-[11px] font-medium",
        s.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {full ? s.label : s.short}
    </span>
  );
}
