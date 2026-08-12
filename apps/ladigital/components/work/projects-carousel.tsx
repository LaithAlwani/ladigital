"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ResolvedProject } from "@/convex/projects";
import { ProjectCard } from "./project-card";
import { cn } from "@/lib/cn";

export function ProjectsCarousel({ projects }: { projects: ResolvedProject[] }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{ startX: number; startScroll: number } | null>(null);

  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);
  const [thumb, setThumb] = React.useState({ width: 0, left: 0 });

  const update = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    setCanLeft(scrollLeft > 2);
    setCanRight(scrollLeft < max - 2);
    const widthRatio = scrollWidth > 0 ? clientWidth / scrollWidth : 1;
    const leftRatio = max > 0 ? (scrollLeft / max) * (1 - widthRatio) : 0;
    setThumb({ width: widthRatio * 100, left: leftRatio * 100 });
  }, []);

  React.useEffect(() => {
    update();
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  function scrollByCards(dir: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  }

  // Draggable custom scrollbar thumb (mobile).
  function onThumbDown(e: React.PointerEvent) {
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = { startX: e.clientX, startScroll: el.scrollLeft };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onThumbMove(e: React.PointerEvent) {
    const el = scrollRef.current;
    const track = trackRef.current;
    const d = dragRef.current;
    if (!el || !track || !d) return;
    const max = el.scrollWidth - el.clientWidth;
    const thumbW = (el.clientWidth / el.scrollWidth) * track.clientWidth;
    const travel = track.clientWidth - thumbW;
    if (travel <= 0) return;
    const deltaPx = e.clientX - d.startX;
    el.scrollLeft = d.startScroll + (deltaPx / travel) * max;
  }
  function onThumbUp(e: React.PointerEvent) {
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  return (
    <div className="mt-8">
      <div className="relative">
        {/* Desktop arrows */}
        <CarouselArrow
          direction="left"
          disabled={!canLeft}
          onClick={() => scrollByCards(-1)}
        />
        <CarouselArrow
          direction="right"
          disabled={!canRight}
          onClick={() => scrollByCards(1)}
        />

        <div
          ref={scrollRef}
          onScroll={update}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {projects.map((p) => (
            <div key={p._id} className="w-[78vw] shrink-0 snap-start sm:w-[340px]">
              <ProjectCard project={p} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile custom scrollbar */}
      <div className="mt-4 lg:hidden">
        <div ref={trackRef} className="relative h-1.5 w-full rounded-full bg-border">
          <div
            role="scrollbar"
            aria-orientation="horizontal"
            aria-controls="selected-work-track"
            onPointerDown={onThumbDown}
            onPointerMove={onThumbMove}
            onPointerUp={onThumbUp}
            style={{ width: `${thumb.width}%`, left: `${thumb.left}%` }}
            className="absolute top-0 h-1.5 cursor-grab touch-none rounded-full bg-brand-orange active:cursor-grabbing"
          />
        </div>
      </div>
    </div>
  );
}

function CarouselArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      className={cn(
        "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-ink/80 text-foreground shadow-card backdrop-blur transition-all hover:border-brand-orange hover:text-brand-orange lg:grid",
        direction === "left" ? "-left-3" : "-right-3",
        disabled && "pointer-events-none opacity-0",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
