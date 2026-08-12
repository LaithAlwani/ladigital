import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "orange";
};

export function Badge({ className, variant = "default", children, ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
        variant === "orange"
          ? "bg-brand-orange text-white shadow-glow-soft"
          : "bg-surface-2 text-muted ring-1 ring-border",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
