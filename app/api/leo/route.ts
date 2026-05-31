import Anthropic from "@anthropic-ai/sdk";
import { getAnthropic } from "@/lib/anthropic";
import { buildLeoSystemBlocks } from "@/lib/leo-prompt";
import { checkRateLimit, getRequestIp } from "@/lib/leo-rate-limit";
import { leoMessageSchema } from "@/lib/schemas";

export const runtime = "nodejs";

const encoder = new TextEncoder();

function sseLine(data: object) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: Request) {
  // Rate-limit first — cheap, bounds abuse before we touch the SDK.
  const ip = getRequestIp(req);
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return new Response(
      JSON.stringify({ error: "rate_limited", retryAfterSec: limit.retryAfterSec }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = leoMessageSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "invalid_request",
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Honeypot tripped — pretend success without calling the API.
  if (parsed.data.website) {
    return new Response(
      sseLine({ type: "done", usage: null, stopReason: "honeypot" }),
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    );
  }

  const client = getAnthropic();
  if (!client) {
    return new Response(JSON.stringify({ error: "not_configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const aStream = client.messages.stream({
          model: "claude-haiku-4-5",
          max_tokens: 1024,
          system: buildLeoSystemBlocks(),
          messages: parsed.data.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        for await (const event of aStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(sseLine({ type: "delta", text: event.delta.text }));
          }
        }

        const final = await aStream.finalMessage();
        controller.enqueue(
          sseLine({ type: "done", usage: final.usage, stopReason: final.stop_reason }),
        );
        controller.close();
      } catch (err) {
        if (err instanceof Anthropic.APIError) {
          console.error("[leo] Anthropic error", err.status, err.message);
          controller.enqueue(
            sseLine({ type: "error", status: err.status, message: err.message }),
          );
        } else {
          console.error("[leo] unexpected error", err);
          controller.enqueue(sseLine({ type: "error", message: "internal_error" }));
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
