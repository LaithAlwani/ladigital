import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ManageBooking } from "@/components/booking/manage-booking";

export const metadata: Metadata = {
  title: "Manage your booking",
  robots: { index: false, follow: false },
};

export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const rules = await fetchQuery(api.availability.getRules, {});

  return (
    <section className="relative isolate overflow-hidden py-20 sm:py-28">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-brand-orange/10 blur-3xl"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-grid opacity-20" />

      <Container size="lg">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Eyebrow className="justify-center">Manage booking</Eyebrow>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Your discovery call
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">
            Reschedule to a new time or cancel — whatever works for you.
          </p>
        </div>

        <ManageBooking token={token} timezone={rules.timezone} />
      </Container>
    </section>
  );
}
