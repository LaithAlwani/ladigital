import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { StatusBadge } from "@/components/work/status-badge";
import { ProjectGallery } from "@/components/work/project-gallery";
import { STATUS_MAP } from "@/lib/project-status";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchQuery(api.projects.getPublishedBySlug, { slug }).catch(() => null);
  if (!project) return { title: "Work" };
  return {
    title: project.title,
    description: project.subtitle || `${project.title} — a project by LA Digital.`,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: project.coverUrl ? { images: [project.coverUrl] } : undefined,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await fetchQuery(api.projects.getPublishedBySlug, { slug }).catch(() => null);
  if (!project) notFound();

  const showLink = STATUS_MAP[project.status].showsLink && project.url;

  return (
    <section className="py-16 sm:py-24">
      <Container size="md">
        <Link
          href="/work"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-brand-orange"
        >
          <ArrowLeft className="h-4 w-4" />
          All work
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {project.title}
              </h1>
              <StatusBadge status={project.status} full />
            </div>
            {project.subtitle ? <p className="mt-2 text-base text-muted">{project.subtitle}</p> : null}
          </div>
          {showLink ? (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-orange px-5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow"
            >
              Visit site
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>

        {project.images.length > 0 ? (
          <div className="mt-8">
            <ProjectGallery images={project.images} title={project.title} />
          </div>
        ) : null}

        {project.description ? (
          <div className="mt-10 max-w-2xl whitespace-pre-line text-base leading-relaxed text-muted">
            {project.description}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
