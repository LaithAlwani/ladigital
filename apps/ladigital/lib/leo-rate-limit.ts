// Simple in-memory per-IP rate limiter. Good enough for low traffic; replace
// with Vercel KV / Upstash Redis when the site scales — see below.
//
// Why a Map and not e.g. Upstash Redis? On serverless platforms each instance
// can have its own Map, so a determined attacker can slip past by hitting
// different cold-start instances. For LA Digital's launch traffic this is
// acceptable. Upgrade path: replace `state` with an Upstash client and the
// rest of the API stays identical.

const WINDOW_MS = 5 * 60_000; // 5 minutes
const MAX_REQUESTS = 10;

type Bucket = { count: number; resetAt: number };

const state = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const bucket = state.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    state.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_REQUESTS - 1 };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, remaining: MAX_REQUESTS - bucket.count };
}

/** Best-effort IP extraction from the standard proxy headers. */
export function getRequestIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
