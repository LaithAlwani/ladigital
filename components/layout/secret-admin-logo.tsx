"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";

// The footer brand mark doubles as a hidden admin entrance: three quick clicks
// (within ~1.2s) navigate to the admin login. A normal visitor sees just a
// static logo (no pointer cursor, no link).
export function SecretAdminLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const router = useRouter();
  const clicks = React.useRef(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClick() {
    clicks.current += 1;
    if (timer.current) clearTimeout(timer.current);
    if (clicks.current >= 3) {
      clicks.current = 0;
      router.push("/admin/login");
      return;
    }
    timer.current = setTimeout(() => {
      clicks.current = 0;
    }, 1200);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="LA Digital"
      className="w-fit cursor-default select-none border-0 bg-transparent p-0 text-left outline-none"
    >
      <Logo size={size} href={null} />
    </button>
  );
}
