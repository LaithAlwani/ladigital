import { ConvexError } from "convex/values";

// Admin mutations are internet-reachable (Convex public functions), so they
// can't trust the caller. Every admin write takes an `adminKey` argument that
// the authenticated Next server action injects from ADMIN_WRITE_KEY (a secret
// shared between the Next server env and the Convex env, never sent to the
// browser). This is the real authorization boundary for admin writes.

export function assertAdmin(adminKey: string): void {
  const expected = process.env.ADMIN_WRITE_KEY;
  if (!expected || adminKey !== expected) {
    throw new ConvexError("Unauthorized — admin key invalid.");
  }
}
