"use client";

import { siteConfig } from "@/lib/site-config";
import { useSettings } from "@/lib/use-settings";
import { SocialIcons } from "@/components/ui/social-icons";

export function FooterSocials({ size = "md" }: { size?: "sm" | "md" }) {
  const settings = useSettings();
  const socials = settings?.socials ?? siteConfig.socials;
  if (!socials || socials.length === 0) return null;
  return <SocialIcons socials={socials} size={size} />;
}
