"use client";

import { createContext, useContext } from "react";
import type { SocialLink } from "@/lib/socials";

// Holds the server-resolved (already filtered) social links so the header,
// mobile menu, and footer render the correct set on first paint — no flash of
// disabled icons.
const SocialsContext = createContext<SocialLink[]>([]);

export function SocialsProvider({
  value,
  children,
}: {
  value: SocialLink[];
  children: React.ReactNode;
}) {
  return <SocialsContext.Provider value={value}>{children}</SocialsContext.Provider>;
}

export function useSocials(): SocialLink[] {
  return useContext(SocialsContext);
}
