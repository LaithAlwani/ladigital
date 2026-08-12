import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLSpanElement>;

export function Eyebrow({ className, children, ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-brand-orange",
        className,
      )}
      {...rest}
    >
      <span aria-hidden className="h-px w-6 bg-brand-orange/60" />
      {children}
    </span>
  );
}
