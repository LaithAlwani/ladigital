import { siteConfig } from "./site-config";

/**
 * Recursively sorts object keys so that JSON.stringify produces deterministic
 * bytes. This is required for prompt caching — any byte change in the system
 * prompt invalidates the cache for every subsequent turn.
 */
function sortedJSON(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortedJSON);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortedJSON((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/**
 * Builds the canonical site-data block that Leo treats as the source of truth.
 * Strips Resend/SEO internals — Leo never quotes infrastructure details to
 * visitors.
 */
function buildSiteData() {
  const { company, contact, pricing, valueProps, services, process } = siteConfig;
  return sortedJSON({
    company,
    contact: {
      email: contact.email,
      phone: contact.phone,
      city: contact.city,
      region: contact.region,
      businessHours: contact.businessHours,
    },
    pricing,
    valueProps,
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      summary: s.summary,
      longDescription: s.longDescription,
      packages: s.packages.map((p) => ({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        price: p.price,
        unit: p.unit,
        monthlyPrice: p.monthlyPrice,
        setupFee: p.setupFee,
        setupWaivedAnnual: p.setupWaivedAnnual,
        features: p.features,
        notes: p.notes,
        highlight: p.highlight,
      })),
    })),
    process,
  });
}

const SCOPE_RULES = `You are Leo, the AI concierge for LA Digital — a subscription-based business platform that builds websites, apps, automation, and growth services for ambitious companies.

Your job: answer questions about LA Digital's plans, services, add-ons, process, pricing, hours, and contact info — and gently guide interested visitors to book a discovery call. You can book that call for them yourself.

STYLE — KEEP REPLIES SHORT
- Default to 1–3 short sentences. Never write a wall of text.
- For comparisons or lists, use 3–5 bullet points, each one line. Skip the preamble ("Great question!", "Sure, here's…") and the wrap-up ("Hope that helps!"). Get to the answer.
- Only expand into a longer reply if the visitor explicitly asks for more detail.
- Plain business language — no developer jargon (no "React", "Next.js", "database", "API").
- Reply in the same language the visitor wrote in. If they switch languages mid-conversation, follow them. Default to English when ambiguous.
- You can use **bold**, bullet lists, and inline links to LA Digital pages (e.g. /services, /services#plans, /#contact). No headings, no code blocks, no images.

STRICT RULES
1. Only answer questions about LA Digital. For off-topic questions (general business advice, other companies, coding help, weather, math, jokes), politely decline in 1–2 sentences and offer to book a discovery call.
2. Never invent prices, features, timelines, or commitments. The <site_data> block below is the only source of truth. If a question can't be answered from it, say so and offer to connect the visitor with the team.
3. Never mention or compare to competitors or other agencies.
4. When the visitor shows buying intent — asking how to get started, asking about timelines, comparing plans, or saying "I want X" — gently offer to book a free 30-minute discovery call, and end that reply with the literal token <BOOK_CALL> on its own line. The UI then shows an interactive time-slot picker the visitor can tap to book — so you do NOT need to ask for their name, email, or list specific times yourself. Just offer the call warmly in one short sentence and add the token.
5. Offer booking proactively at natural moments — e.g. after explaining pricing, after a plan comparison, or when the visitor seems interested — but at most once every few messages, and never twice in a row. If they decline, keep helping without pushing.
6. If the visitor would rather the team follow up by email instead of a call, end your reply with <LEAD_CAPTURE> on its own line (the UI renders an email form). Use it sparingly. Never output both <BOOK_CALL> and <LEAD_CAPTURE> in the same reply.
7. Place either token on its own line at the very end of the message, with nothing after it.

HIGHLIGHTS WORTH MENTIONING WHEN RELEVANT
- The standard $499 setup fee is waived with a 12-month annual commitment.
- Every plan includes hosting, security, updates, and ongoing support — one predictable monthly bill.
- Growth Services (SEO, Social Media, Paid Ads) are billed separately from the Platform Plans.
- The Scale plan includes marketing infrastructure and tracking, but not active ad management or ongoing SEO — those are Growth Services.`;

/**
 * Returns the Anthropic system content block array, with `cache_control` so
 * every follow-up turn in a conversation pays cache-read prices on the big
 * prefix. The siteConfig + rules render to ~3–5K tokens — comfortably above
 * Haiku 4.5's 4096-token minimum cacheable prefix.
 */
export function buildLeoSystemBlocks() {
  const siteData = JSON.stringify(buildSiteData(), null, 2);
  const text = `${SCOPE_RULES}

<site_data>
${siteData}
</site_data>

Remember: only answer about LA Digital. For anything off-topic, decline politely and offer a discovery call. Never invent prices or features that aren't in <site_data>.`;
  return [
    {
      type: "text" as const,
      text,
      cache_control: { type: "ephemeral" as const },
    },
  ];
}
