import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// ----------------------------------------------------------------------------
// Google OAuth endpoints (owner-only, one-time connect). The connect route
// just builds the consent URL; the callback exchanges the code via the Node
// action so the client secret stays server-side.
//   Connect:  GET {CONVEX_SITE_URL}/google/connect
//   Callback: GET {CONVEX_SITE_URL}/google/callback?code=...
// ----------------------------------------------------------------------------

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

function page(title: string, body: string, ok: boolean): Response {
  const accent = ok ? "#22c55e" : "#ef4444";
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#07080a;color:#f5f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:grid;place-items:center;min-height:100vh">
<div style="max-width:440px;padding:32px;text-align:center">
<div style="height:4px;width:48px;background:${accent};border-radius:2px;margin:0 auto 20px"></div>
<h1 style="font-size:20px;margin:0 0 8px">${title}</h1>
<p style="color:#a3a7ad;line-height:1.6;margin:0">${body}</p>
</div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

const http = httpRouter();

http.route({
  path: "/google/connect",
  method: "GET",
  handler: httpAction(async () => {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      return page(
        "Google not configured",
        "Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and GOOGLE_OAUTH_REDIRECT_URI in the Convex environment first.",
        false,
      );
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
    });
    return new Response(null, {
      status: 302,
      headers: { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` },
    });
  }),
});

http.route({
  path: "/google/callback",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const error = url.searchParams.get("error");
    if (error) return page("Connection cancelled", `Google reported: ${error}`, false);
    const code = url.searchParams.get("code");
    if (!code) return page("Missing code", "No authorization code was returned by Google.", false);

    const result = await ctx.runAction(internal.google.exchangeAndStore, { code });
    if (!result.ok) {
      return page("Couldn't connect", result.error ?? "Token exchange failed.", false);
    }
    return page(
      "Google Calendar connected",
      "Availability now reflects your real calendar and new bookings will appear as events. You can close this tab.",
      true,
    );
  }),
});

export default http;
