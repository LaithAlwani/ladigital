import { authorizeAgent, agentJson, agentError } from "@ladigital/agent-api";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { adminWriteKey } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// GET /api/agent/contacts?email=&phone= — recognize a returning lead in the CRM.
// The agent is authorized by AGENT_API_KEY; the admin key stays server-side.
export async function GET(req: Request) {
  const auth = authorizeAgent(req, process.env.AGENT_API_KEY);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.trim() || undefined;
  const phone = url.searchParams.get("phone")?.trim() || undefined;
  if (!email && !phone) return agentError("Provide `email` or `phone`.");

  const contact = await fetchQuery(api.crm.findContact, {
    adminKey: adminWriteKey(),
    email,
    phone,
  }).catch(() => null);

  return agentJson({ ok: true, contact: contact ?? null });
}
