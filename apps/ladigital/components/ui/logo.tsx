import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const DIM: Record<Size, { w: number; h: number; cls: string }> = {
  sm: { w: 40, h: 40, cls: "h-9 w-9" },
  md: { w: 64, h: 64, cls: "h-14 w-14" },
  lg: { w: 88, h: 88, cls: "h-20 w-20" },
};

type Props = {
  size?: Size;
  className?: string;
  withWordmark?: boolean;
  href?: string | null;
  alt?: string;
  priority?: boolean;
};

export function Logo({
  size = "sm",
  className,
  withWordmark = true,
  href = "/",
  alt = "LA Digital logo",
  priority,
}: Props) {
  const d = DIM[size];
  const inner = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative grid place-items-center rounded-md bg-white p-1.5 ring-1 ring-border",
          d.cls,
        )}
      >
        <Image
          src="/logo_300dpi.webp"
          alt={alt}
          width={d.w}
          height={d.h}
          priority={priority}
          className="h-full w-full object-contain"
        />
      </span>
      {withWordmark ? (
        <span className="flex flex-col leading-none">
          <span className="font-display text-base font-bold tracking-tight text-foreground">
            LA Digital
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
            Web · Apps · AI
          </span>
        </span>
      ) : null}
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} className="inline-flex items-center gap-3 outline-none">
      {inner}
    </Link>
  );
}
