import * as React from "react";
import { cn } from "@/lib/cn";
import { Container } from "./container";

type Props = React.HTMLAttributes<HTMLElement> & {
  id?: string;
  containerSize?: "sm" | "md" | "lg" | "xl";
  /** Pads vertically. Defaults to "md". */
  padding?: "sm" | "md" | "lg";
  /** Children render inside the container by default. Set to false to bypass. */
  withContainer?: boolean;
};

const PADDING = {
  sm: "py-12 md:py-16",
  md: "py-20 md:py-28",
  lg: "py-24 md:py-36",
};

export function Section({
  id,
  containerSize = "xl",
  padding = "md",
  withContainer = true,
  className,
  children,
  ...rest
}: Props) {
  return (
    <section id={id} className={cn(PADDING[padding], "relative", className)} {...rest}>
      {withContainer ? <Container size={containerSize}>{children}</Container> : children}
    </section>
  );
}
