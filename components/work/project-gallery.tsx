"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Img = { url: string | null; alt?: string };

export function ProjectGallery({ images, title }: { images: Img[]; title: string }) {
  const [active, setActive] = React.useState(0);
  if (images.length === 0) return null;
  const main = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[16/10] overflow-hidden rounded-card border border-border bg-ink">
        {main.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={main.url} alt={main.alt || title} className="h-full w-full object-cover" />
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg border transition-colors",
                i === active ? "border-brand-orange" : "border-border hover:border-border-strong",
              )}
            >
              {img.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
