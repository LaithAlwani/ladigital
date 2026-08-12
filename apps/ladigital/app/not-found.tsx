import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container size="md" className="flex min-h-[60vh] flex-col items-center justify-center pt-32 text-center">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-brand-orange">404</p>
      <h1 className="mb-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Page not found
      </h1>
      <p className="mb-8 max-w-md text-sm text-muted">
        The page you're looking for moved or never existed. Let's get you back on track.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-orange-soft"
      >
        Back home
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Container>
  );
}
