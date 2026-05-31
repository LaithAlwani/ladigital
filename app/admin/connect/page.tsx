import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";

export const metadata: Metadata = {
  title: "Connect Google Calendar",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Temporary owner-only connect page for Phase 1. Phase 2 folds this into the
// authenticated admin and protects it via proxy.ts.
export default async function ConnectPage() {
  const connected = await fetchQuery(api.googleTokens.isConnected, {}).catch(() => false);
  const siteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL?.trim().replace(/\/$/, "");
  const connectUrl = siteUrl ? `${siteUrl}/google/connect` : null;

  return (
    <section className="py-20 sm:py-28">
      <Container size="md">
        <div className="mx-auto max-w-lg rounded-card border border-border bg-surface/40 p-8">
          <Eyebrow>Admin · Calendar</Eyebrow>
          <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">
            Google Calendar connection
          </h1>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-ink/40 p-4">
            {connected ? (
              <>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                <p className="text-sm text-foreground">
                  Connected. Availability reflects your real calendar and new bookings appear as
                  events with a Meet link.
                </p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 shrink-0 text-brand-orange" />
                <p className="text-sm text-muted">
                  Not connected yet. Until you connect, bookings are still saved and emailed — they
                  just won't create calendar events or check your real free/busy.
                </p>
              </>
            )}
          </div>

          {connectUrl ? (
            <a
              href={connectUrl}
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-orange px-6 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow"
            >
              {connected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
            </a>
          ) : (
            <p className="mt-6 text-sm text-danger">
              NEXT_PUBLIC_CONVEX_SITE_URL is not set — can't build the connect link.
            </p>
          )}

          <p className="mt-4 text-xs text-muted-2">
            You'll be sent to Google to grant calendar access. Only the business owner should use
            this page.
          </p>
        </div>
      </Container>
    </section>
  );
}
