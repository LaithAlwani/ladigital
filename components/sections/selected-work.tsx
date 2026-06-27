import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ProjectsCarousel } from "@/components/work/projects-carousel";

// Async server section — renders nothing until there are published projects,
// so the home page is unaffected until the owner adds work in the admin.
export async function SelectedWork() {
  const projects = await fetchQuery(api.projects.listPublished, {}).catch(() => []);
  if (projects.length === 0) return null;
  const shown = projects.slice(0, 12);

  return (
    <section className="overflow-hidden py-20 sm:py-28">
      <Container size="lg">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Selected work</Eyebrow>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
              A few projects we're proud of.
            </h2>
          </div>
          {projects.length > shown.length ? (
            <Link
              href="/work"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-orange hover:text-brand-orange-soft"
            >
              View all work
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>

        <ProjectsCarousel projects={shown} />
      </Container>
    </section>
  );
}
