import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ProjectCard } from "@/components/work/project-card";

export const metadata: Metadata = {
  title: "Our work",
  description:
    "A selection of websites, apps, and platforms LA Digital has designed and built for businesses.",
  alternates: { canonical: "/work" },
};

export default async function WorkPage() {
  const projects = await fetchQuery(api.projects.listPublished, {}).catch(() => []);

  return (
    <section className="py-20 sm:py-28">
      <Container size="lg">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Eyebrow className="justify-center">Our work</Eyebrow>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-foreground text-balance sm:text-5xl">
            Projects we've designed and built.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted">
            A look at some of the websites, apps, and platforms we've shipped for our clients.
          </p>
        </div>

        {projects.length === 0 ? (
          <p className="text-center text-sm text-muted">Work is being added soon — check back shortly.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p._id} project={p} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
