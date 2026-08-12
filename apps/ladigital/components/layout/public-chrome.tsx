"use client";

import { usePathname } from "next/navigation";

// Hides the marketing header/footer/chat on the /admin area so the admin gets
// its own full-screen layout.
export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
