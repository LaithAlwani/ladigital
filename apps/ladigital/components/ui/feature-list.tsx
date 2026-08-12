import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  items: string[];
  className?: string;
};

export function FeatureList({ items, className }: Props) {
  return (
    <ul className={cn("flex flex-col gap-2.5", className)}>
      {items.map((it) => (
        <li key={it} className="flex items-start gap-2.5 text-sm text-foreground/90">
          <span className="mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full bg-brand-orange/20 text-brand-orange">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span className="leading-snug">{it}</span>
        </li>
      ))}
    </ul>
  );
}
