import { authorizeAgent, agentJson, agentError } from "@ladigital/agent-api";
import { rescheduleBooking } from "@/app/actions/booking";

export const dynamic = "force-dynamic";

// POST /api/agent/bookings/{token}/reschedule — body: { startUtc }. Reuses the
// site's reschedule flow (slot re-check + Google patch + email).
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const auth = authorizeAgent(req, process.env.AGENT_API_KEY);
  if (!auth.ok) return auth.response;
  const { token } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return agentError("Invalid JSON body.");
  }
  if (typeof body.startUtc !== "number") {
    return agentError("`startUtc` (epoch ms) is required.");
  }

  const res = await rescheduleBooking(token, body.startUtc);
  if (!res.ok) return agentError(res.message, 409);
  return agentJson({
    ok: true,
    startUtc: res.startUtc ?? null,
    endUtc: res.endUtc ?? null,
    meetLink: res.meetLink ?? null,
  });
}
