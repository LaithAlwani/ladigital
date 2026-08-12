import { authorizeAgent, agentJson, agentError } from "@ladigital/agent-api";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

// GET /api/agent/bookings/{token} — look up a booking by its manageToken.
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const auth = authorizeAgent(req, process.env.AGENT_API_KEY);
  if (!auth.ok) return auth.response;
  const { token } = await params;
  const b = await fetchQuery(api.bookings.getByToken, { token });
  if (!b) return agentError("Booking not found.", 404);
  return agentJson({
    ok: true,
    booking: {
      name: b.name,
      email: b.email,
      phone: b.phone ?? null,
      company: b.company ?? null,
      startUtc: b.startUtc,
      endUtc: b.endUtc,
      status: b.status,
      meetLink: b.meetLink ?? null,
    },
  });
}
