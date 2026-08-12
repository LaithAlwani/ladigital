import { authorizeAgent, agentJson, agentError } from "@ladigital/agent-api";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { adminWriteKey } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

// POST /api/agent/leads — capture a lead into the CRM (and optionally open a
// deal). The agent is authorized by OMNIVO_API_KEY; the admin write key stays
// server-side and is never exposed to the caller.
export async function POST(req: Request) {
  const auth = authorizeAgent(req, process.env.OMNIVO_API_KEY);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return agentError("Invalid JSON body.");
  }

  const name = str(body.name);
  if (!name) return agentError("`name` is required.");

  const key = adminWriteKey();
  const contactId = await fetchMutation(api.crm.createContact, {
    adminKey: key,
    name,
    company: str(body.company),
    email: str(body.email),
    phone: str(body.phone),
    notes: str(body.notes),
    source: "omnivo",
  });

  let dealId: Id<"deals"> | null = null;
  const dealTitle = str(body.dealTitle);
  if (dealTitle) {
    dealId = await fetchMutation(api.crm.createDeal, {
      adminKey: key,
      title: dealTitle,
      contactId,
      value: typeof body.dealValue === "number" ? body.dealValue : undefined,
    });
  }

  return agentJson({ ok: true, contactId, dealId });
}
