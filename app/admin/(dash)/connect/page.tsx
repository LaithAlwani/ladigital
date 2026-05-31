import { fetchQuery } from "convex/nextjs";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

export default async function ConnectPage() {
  const connected = await fetchQuery(api.googleTokens.isConnected, {}).catch(() => false);
  const siteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL?.trim().replace(/\/$/, "");
  const connectUrl = siteUrl ? `${siteUrl}/google/connect` : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">Google Calendar</h1>
        <p className="mt-1 text-sm text-muted">
          Connect your calendar so availability reflects your real free/busy and bookings appear as
          events with a Meet link.
        </p>
      </div>

      <div className="max-w-lg rounded-card border border-border bg-surface/40 p-6">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-ink/40 p-4">
          {connected ? (
            <>
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              <p className="text-sm text-foreground">
                Connected. New bookings create calendar events with a Meet link and availability
                checks your real free/busy.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 shrink-0 text-brand-orange" />
              <p className="text-sm text-muted">
                Not connected. Bookings are still saved and emailed — they just won't create
                calendar events or check your real free/busy.
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
          You'll be sent to Google to grant calendar access. Requires the Google OAuth env vars set
          in the Convex deployment.
        </p>
      </div>
    </div>
  );
}
