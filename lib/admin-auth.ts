// ----------------------------------------------------------------------------
// Self-contained single-admin session. A signed (HMAC-SHA256) token in an
// httpOnly cookie. Uses Web Crypto only, so it runs in any runtime — the
// Next 16 proxy, server actions, and server components alike. No external
// auth dependency.
//
// Secrets (server env only, never exposed to the browser):
//   ADMIN_PASSWORD        — the admin login password
//   ADMIN_SESSION_SECRET  — HMAC key for signing the session cookie
//   ADMIN_WRITE_KEY       — shared with Convex; authorizes admin mutations
// ----------------------------------------------------------------------------

export const ADMIN_COOKIE = "la_admin";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)

const encoder = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToString(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return bin;
}

async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return b64url(new Uint8Array(sig));
}

function sessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET?.trim() || null;
}

/** Issue a signed session token valid for ADMIN_SESSION_MAX_AGE. */
export async function createSession(): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const payload = b64url(
    encoder.encode(JSON.stringify({ exp: Date.now() + ADMIN_SESSION_MAX_AGE * 1000 })),
  );
  const sig = await hmac(payload, secret);
  return `${payload}.${sig}`;
}

/** Validate a session token's signature and expiry. */
export async function verifySession(token: string | undefined | null): Promise<boolean> {
  const secret = sessionSecret();
  if (!token || !secret) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(payload, secret);
  if (sig.length !== expected.length || sig !== expected) return false;
  try {
    const { exp } = JSON.parse(b64urlToString(payload)) as { exp?: number };
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}

/** Constant-time-ish password check (compares HMAC digests of the inputs). */
export async function checkPassword(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  const secret = sessionSecret();
  if (!expected || !secret) return false;
  const [a, b] = await Promise.all([hmac(input, secret), hmac(expected, secret)]);
  return a.length === b.length && a === b;
}
