import { authorizeAgent, agentJson, agentError } from "@ladigital/agent-api";
import { cancelBooking } from "@/app/actions/booking";

export const dynamic = "force-dynamic";

// POST /api/agent/bookings/{token}/cancel — reuses the site's cancel flow
// (Google delete + cancellation email).
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const auth = authorizeAgent(req, process.env.AGENT_API_KEY);
  if (!auth.ok) return auth.response;
  const { token } = await params;
  const res = await cancelBooking(token);
  if (!res.ok) return agentError(res.message, 409);
  return agentJson({ ok: true });
}
