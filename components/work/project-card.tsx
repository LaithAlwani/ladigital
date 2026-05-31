import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { ResolvedProject } from "@/convex/projects";
import { StatusBadge } from "./status-badge";

export function ProjectCard({ project }: { project: ResolvedProject }) {
  return (
    <Link
      href={`/work/${project.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface/40 transition-all duration-300 hover:border-border-strong hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ink">
        {project.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.coverUrl}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-2">
            <ImageOff className="h-7 w-7" />
          </div>
        )}
        <span className="absolute right-3 top-3">
          <StatusBadge status={project.status} />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="font-display text-lg font-semibold text-foreground transition-colors group-hover:text-brand-orange">
          {project.title}
        </h3>
        {project.subtitle ? <p className="text-sm text-muted">{project.subtitle}</p> : null}
      </div>
    </Link>
  );
}
