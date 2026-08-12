# Agent API — connect Omnivo AI (or any assistant) to a client

Each client site exposes a small HTTP API that an external AI assistant calls to
check availability, book/reschedule/cancel appointments, and drop leads into the
CRM. Because every client is its own app + Convex deployment, **each client has
its own URL and its own key** — to enable Omnivo for a client, you just plug in
those two values.

- **Base URL:** the client's own domain — `https://<client-domain>/api/agent`
  (e.g. `https://ladigital.ca/api/agent`).
- **Auth:** `Authorization: Bearer <OMNIVO_API_KEY>` (or `x-api-key: <key>`).
- **Times:** epoch milliseconds, UTC.
- Reuses the site's real booking flow, so Google Calendar events + confirmation
  emails fire exactly as they do on the website. Lead capture writes to the CRM.

## Turn it on for a client (2 steps)

1. **Generate a key** and set it on the client's deployment (Vercel env + local):

   ```bash
   openssl rand -hex 32          # -> paste as OMNIVO_API_KEY
   ```

   Set `OMNIVO_API_KEY` in the client's Vercel project (and `.env.local`). No
   code changes — the routes read this env var.

2. **In Omnivo**, add this client/provider with:
   - URL `https://<client-domain>/api/agent`
   - Key = the value you generated

   That's it. If a client doesn't want Omnivo, leave `OMNIVO_API_KEY` unset and
   every endpoint returns `503 not configured`.

> The key only unlocks these agent endpoints. The admin write key that the
> `/leads` route uses to write to the CRM stays server-side and is never exposed
> to Omnivo.

## Endpoints

`GET /api/agent` returns this contract at runtime (capabilities + endpoints).

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/agent/availability` | — | `days[]` → `{ date, slots[{ startUtc, endUtc, label }] }` |
| POST | `/api/agent/bookings` | `{ name, email, startUtc, phone?, company?, notes? }` | `{ manageToken, startUtc, endUtc, meetLink?, manageUrl }` |
| GET | `/api/agent/bookings/{token}` | — | `{ booking: { name, email, startUtc, endUtc, status, meetLink } }` |
| POST | `/api/agent/bookings/{token}/reschedule` | `{ startUtc }` | `{ startUtc, endUtc, meetLink? }` |
| POST | `/api/agent/bookings/{token}/cancel` | — | `{ ok }` |
| POST | `/api/agent/leads` | `{ name, email?, phone?, company?, notes?, dealTitle?, dealValue? }` | `{ contactId, dealId? }` |

All responses are JSON with an `ok` boolean; failures include `{ ok: false, error }`
and a matching HTTP status (`401` bad key, `404` not found, `409` slot taken /
booking closed, `502` scheduler unreachable, `503` not configured).

## Examples

```bash
BASE=https://ladigital.ca/api/agent
KEY=omnivo_live_xxx

# what's open?
curl -s "$BASE/availability" -H "Authorization: Bearer $KEY"

# book a slot the assistant picked
curl -s -X POST "$BASE/bookings" -H "Authorization: Bearer $KEY" \
  -H "content-type: application/json" \
  -d '{"name":"Sam Lee","email":"sam@acme.com","startUtc":1765302000000}'

# capture a lead + open a deal
curl -s -X POST "$BASE/leads" -H "Authorization: Bearer $KEY" \
  -H "content-type: application/json" \
  -d '{"name":"Sam Lee","email":"sam@acme.com","dealTitle":"Website enquiry"}'
```

## Notes

- The routes ship with every scaffolded client (they're copied by
  `create-client`), so a new client is Omnivo-ready as soon as you set its key.
- `/leads` requires the CRM tables (`...crmTables`) to be deployed on that
  client's Convex; booking endpoints require the booking tables.
- Booking creation marks `source: "omnivo"` so you can tell AI-driven bookings
  and leads apart in the admin.
