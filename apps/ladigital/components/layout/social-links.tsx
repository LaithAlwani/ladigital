"use client";

import { useSocials } from "@/components/providers/socials-provider";
import { SocialIcons } from "@/components/ui/social-icons";

// Reactive social links used in the header, mobile menu, and footer. The list
// is resolved + filtered on the server (see RootLayout) and provided via
// context, so the correct set renders on first paint — no flash.
export function SocialLinks({ size = "md", className }: { size?: "sm" | "md"; className?: string }) {
  const socials = useSocials();
  if (socials.length === 0) return null;
  return <SocialIcons socials={socials} size={size} className={className} />;
}
