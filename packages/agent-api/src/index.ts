// ---------------------------------------------------------------------------
// @ladigital/agent-api — the shared contract + auth for the per-client HTTP API
// that an external AI assistant (e.g. Omnivo AI) calls to check availability,
// book/reschedule/cancel appointments, and capture leads into the CRM.
//
// Each client app exposes these as Next.js routes under /api/agent on its OWN
// domain, guarded by that client's own OMNIVO_API_KEY. "Plug in URL + key" is
// all the integration needs: the URL is the client's site, the key is the env
// var below.
// ---------------------------------------------------------------------------

/** Pull the API key from `Authorization: Bearer <key>` or `x-api-key`. */
export function readApiKey(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  const x = req.headers.get("x-api-key");
  return x ? x.trim() : null;
}

/** Length-safe string compare so auth doesn't leak timing. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export type AgentAuth = { ok: true } | { ok: false; response: Response };

/**
 * Authorize an incoming agent request against the client's OMNIVO_API_KEY.
 * Returns a ready-to-return 401/503 Response on failure so route handlers stay
 * one-liners: `const a = authorizeAgent(req, key); if (!a.ok) return a.response;`
 */
export function authorizeAgent(req: Request, expectedKey: string | undefined): AgentAuth {
  if (!expectedKey) return { ok: false, response: agentError("Agent API is not configured.", 503) };
  const provided = readApiKey(req);
  if (!provided || !safeEqual(provided, expectedKey)) {
    return { ok: false, response: agentError("Unauthorized.", 401) };
  }
  return { ok: true };
}

export function agentJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function agentError(message: string, status = 400): Response {
  return agentJson({ ok: false, error: message }, status);
}

/** The contract, served at GET /api/agent so a provider integration is
 *  self-describing. Times are epoch milliseconds (UTC). Auth: Bearer key. */
export const AGENT_ENDPOINTS = [
  { method: "GET", path: "/api/agent", summary: "This descriptor: capabilities + endpoints." },
  {
    method: "GET",
    path: "/api/agent/availability",
    summary: "Open appointment slots. Returns days[] with slots[{ startUtc, endUtc, label }].",
  },
  {
    method: "POST",
    path: "/api/agent/bookings",
    summary: "Book an appointment.",
    body: { name: "string", email: "string", startUtc: "number(epoch ms)", phone: "string?", company: "string?", notes: "string?" },
    returns: { manageToken: "string", startUtc: "number", endUtc: "number", meetLink: "string?", manageUrl: "string" },
  },
  {
    method: "GET",
    path: "/api/agent/bookings/{token}",
    summary: "Look up a booking by its manageToken.",
  },
  {
    method: "POST",
    path: "/api/agent/bookings/{token}/reschedule",
    summary: "Move a booking to a new time.",
    body: { startUtc: "number(epoch ms)" },
  },
  {
    method: "POST",
    path: "/api/agent/bookings/{token}/cancel",
    summary: "Cancel a booking.",
  },
  {
    method: "POST",
    path: "/api/agent/leads",
    summary: "Capture a lead into the CRM (optionally opening a deal).",
    body: { name: "string", email: "string?", phone: "string?", company: "string?", notes: "string?", dealTitle: "string?", dealValue: "number?" },
    returns: { contactId: "string", dealId: "string?" },
  },
] as const;
