import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySession } from "./admin-auth";

// Server-only helpers for reading the admin session in server components and
// server actions. (The proxy reads the cookie off the request directly.)

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySession(store.get(ADMIN_COOKIE)?.value);
}

/** Redirect to the login page if the caller isn't an authenticated admin. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** The shared key sent to Convex to authorize admin mutations. */
export function adminWriteKey(): string {
  return process.env.ADMIN_WRITE_KEY ?? "";
}
