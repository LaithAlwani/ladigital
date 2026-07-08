import { Logo } from "@/components/ui/logo";

// The footer brand mark doubles as a hidden admin entrance: the whole logo is a
// normal single-click link to /admin (which redirects to the login form if
// you're not signed in). Not advertised anywhere else.
export function SecretAdminLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return <Logo size={size} href="/admin" />;
}
