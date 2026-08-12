import { authorizeAgent, agentJson, agentError } from "@ladigital/agent-api";
import { fetchAction, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { siteBase, sendBookingEmails } from "@/lib/booking-emails";
import { formatBookingWhen } from "@/lib/booking-format";

export const dynamic = "force-dynamic";

// POST /api/agent/bookings — book an appointment through the same flow as the
// website (transactional slot re-check + Google event + confirmation emails).
export async function POST(req: Request) {
  const auth = authorizeAgent(req, process.env.AGENT_API_KEY);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return agentError("Invalid JSON body.");
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const startUtc = body.startUtc;
  if (!name || !email || typeof startUtc !== "number") {
    return agentError("`name`, `email`, and `startUtc` (epoch ms) are required.");
  }
  const phone = typeof body.phone === "string" ? body.phone : undefined;
  const company = typeof body.company === "string" ? body.company : undefined;
  const notes = typeof body.notes === "string" ? body.notes : undefined;

  let result;
  try {
    result = await fetchAction(api.bookings.book, {
      name,
      email,
      phone,
      company,
      notes,
      startUtc,
      source: "omnivo",
    });
  } catch (err) {
    console.error("[agent] book failed:", err);
    return agentError("Could not reach the scheduler.", 502);
  }
  if (!result.ok) return agentError(result.reason, 409);

  const rules = await fetchQuery(api.availability.getRules, {});
  const whenText = formatBookingWhen(result.startUtc, result.endUtc, rules.timezone);
  const manageUrl = `${siteBase()}/book/manage/${result.manageToken}`;
  try {
    await sendBookingEmails({
      kind: "confirmed",
      name,
      email,
      phone,
      company,
      notes,
      whenText,
      meetLink: result.meetLink,
      manageUrl,
    });
  } catch (err) {
    console.error("[agent] booking email failed (non-fatal):", err);
  }

  return agentJson({
    ok: true,
    manageToken: result.manageToken,
    startUtc: result.startUtc,
    endUtc: result.endUtc,
    meetLink: result.meetLink ?? null,
    manageUrl,
  });
}
