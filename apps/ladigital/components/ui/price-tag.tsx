import { cn } from "@/lib/cn";

// Signature element for the reposition: a physical price-tag sticker that ties
// the whole brand to "professional websites without the agency price tag."
// Reused in the hero and the website offer.
type Props = {
  price?: string;
  unit?: string;
  className?: string;
  size?: "md" | "lg";
};

export function PriceTag({ price = "$49", unit = "/mo", className, size = "md" }: Props) {
  const big = size === "lg";
  return (
    <span
      className={cn(
        "relative inline-flex -rotate-6 select-none items-baseline gap-1 rounded-xl bg-brand-orange font-display font-bold text-white shadow-glow",
        big ? "px-5 py-3" : "px-4 py-2.5",
        className,
      )}
    >
      {/* Tag punch-hole */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full bg-ink ring-2 ring-white/70",
          big ? "-left-2 h-3.5 w-3.5" : "-left-1.5 h-3 w-3",
        )}
      />
      <span className={cn("leading-none tracking-tight", big ? "text-4xl" : "text-2xl")}>{price}</span>
      <span className={cn("font-semibold text-white/85", big ? "text-sm" : "text-xs")}>{unit}</span>
    </span>
  );
}
