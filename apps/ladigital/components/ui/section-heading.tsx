import * as React from "react";
import { cn } from "@/lib/cn";
import { Eyebrow } from "./eyebrow";

type Props = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  /** Render heading as h1 instead of h2. */
  as?: "h1" | "h2";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  as = "h2",
}: Props) {
  const Heading = as;
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Heading
        className={cn(
          "font-display font-semibold tracking-tight text-foreground text-balance",
          as === "h1"
            ? "text-4xl sm:text-5xl md:text-6xl leading-[1.05]"
            : "text-3xl sm:text-4xl md:text-5xl leading-[1.1]",
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p className={cn("max-w-2xl text-base sm:text-lg text-muted", align === "center" && "mx-auto")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
