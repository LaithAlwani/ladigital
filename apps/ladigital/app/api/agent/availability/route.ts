import { authorizeAgent, agentJson } from "@ladigital/agent-api";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

// GET /api/agent/availability — open slots, same source the booking page uses.
export async function GET(req: Request) {
  const auth = authorizeAgent(req, process.env.AGENT_API_KEY);
  if (!auth.ok) return auth.response;
  const days = await fetchQuery(api.slots.list, {}).catch(() => []);
  return agentJson({ ok: true, days });
}
