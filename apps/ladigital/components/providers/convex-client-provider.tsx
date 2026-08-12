"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import * as React from "react";

// A single browser-side Convex client. Reactive hooks (useQuery/useMutation)
// in the booking flow — and later the admin — read through this. The URL is
// the only Convex value exposed to the client.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

let client: ConvexReactClient | null = null;
function getClient(): ConvexReactClient | null {
  if (!convexUrl) return null;
  if (!client) client = new ConvexReactClient(convexUrl);
  return client;
}

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const convex = getClient();
  // Without a configured URL (e.g. misconfigured env) we render children
  // directly so the rest of the site still works; Convex-backed widgets
  // handle the missing client by showing their own fallback.
  if (!convex) return <>{children}</>;
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
