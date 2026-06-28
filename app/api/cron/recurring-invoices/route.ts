import { render } from "@react-email/components";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { sendMail } from "@/lib/mailer";
import { siteConfig } from "@/lib/site-config";
import { invoiceTotals, formatMoney, formatDate } from "@/lib/invoice";
import { invoicePdfBase64Server } from "@/lib/invoice-pdf-server";
import InvoiceEmail from "@/emails/invoice-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generates due recurring invoices and emails each to the client. Triggered by
// the Vercel cron (daily — see vercel.json), or manually with the secret:
//   GET /api/cron/recurring-invoices  (Authorization: Bearer $CRON_SECRET)
//   or ?secret=$CRON_SECRET
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  return auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const adminKey = process.env.ADMIN_WRITE_KEY ?? "";
  const results: { source: string; created: string; emailed: boolean; note?: string }[] = [];

  try {
    const due = await fetchQuery(api.invoices.dueRecurring, { adminKey });

    for (const src of due) {
      const newId = await fetchMutation(api.invoices.spawnRecurring, {
        adminKey,
        sourceId: src._id,
      });
      if (!newId) continue;
      const inv = await fetchQuery(api.invoices.getAdmin, { adminKey, id: newId });
      if (!inv) continue;

      let emailed = false;
      let note: string | undefined;

      if (inv.clientEmail) {
        try {
          const { total } = invoiceTotals(inv.items, inv.taxRate);
          const html = await render(
            InvoiceEmail({
              clientName: inv.clientName || inv.clientCompany || "there",
              number: inv.number,
              totalText: formatMoney(total, inv.currency),
              dueText: formatDate(inv.dueDate),
              notes: inv.notes,
            }),
          );
          const pdf = invoicePdfBase64Server({
            number: inv.number,
            clientName: inv.clientName,
            clientCompany: inv.clientCompany,
            clientEmail: inv.clientEmail,
            clientAddress: inv.clientAddress,
            items: inv.items,
            taxRate: inv.taxRate,
            currency: inv.currency,
            issueDate: inv.issueDate,
            dueDate: inv.dueDate,
            notes: inv.notes,
          });
          const r = await sendMail({
            to: inv.clientEmail,
            replyTo: siteConfig.contact.email,
            subject: `Invoice ${inv.number} from ${siteConfig.company.name}`,
            html,
            attachments: [
              { filename: `${inv.number}.pdf`, content: pdf, contentType: "application/pdf" },
            ],
          });
          if (r.ok && !r.skipped) {
            emailed = true;
            await fetchMutation(api.invoices.setStatus, { adminKey, id: newId, status: "sent" });
          } else {
            note = r.ok ? "SMTP not configured" : r.error;
          }
        } catch (err) {
          note = err instanceof Error ? err.message : "email failed";
        }
      } else {
        note = "no client email";
      }

      results.push({ source: src.number, created: inv.number, emailed, note });
    }

    return Response.json({ ok: true, generated: results.length, results });
  } catch (err) {
    console.error("[cron/recurring-invoices]", err);
    return new Response(JSON.stringify({ ok: false, error: "cron_failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
