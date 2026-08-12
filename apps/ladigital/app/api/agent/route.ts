import { authorizeAgent, agentJson, AGENT_ENDPOINTS } from "@ladigital/agent-api";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

// GET /api/agent — self-describing contract so a provider (e.g. Omnivo AI) can
// be configured against this client with just the URL + key.
export async function GET(req: Request) {
  const auth = authorizeAgent(req, process.env.OMNIVO_API_KEY);
  if (!auth.ok) return auth.response;
  return agentJson({
    ok: true,
    provider: {
      name: brand.identity.name,
      timezone: brand.timezone,
      locale: brand.locale,
      meetingNoun: brand.meetingNoun,
    },
    auth: "Send the API key as `Authorization: Bearer <OMNIVO_API_KEY>` (or the `x-api-key` header).",
    timeFormat: "All times are epoch milliseconds (UTC).",
    endpoints: AGENT_ENDPOINTS,
  });
}
