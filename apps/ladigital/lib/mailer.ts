import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

// ----------------------------------------------------------------------------
// Nodemailer transport — the single email sender for the whole site.
//
// SMTP credentials come from env (never hard-coded). When they're absent
// (e.g. local dev without an SMTP account) sendMail() logs and pretends
// success so flows can be exercised without a live mailbox — this mirrors
// the old getResend() dev-mode fallback so nothing hard-fails.
// ----------------------------------------------------------------------------

let transporter: Transporter | null = null;

function getTransport(): Transporter | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    // SMTP_SECURE forces TLS-on-connect (port 465). Otherwise we use STARTTLS
    // (port 587), which nodemailer negotiates automatically when secure=false.
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }
  return transporter;
}

/** Default From / owner-To addresses, overridable per-call. */
export function mailFrom(): string {
  return process.env.MAIL_FROM?.trim() || "LA Digital <no-reply@ladigital.ca>";
}
export function mailTo(): string {
  return process.env.MAIL_TO?.trim() || "laithalwani@gmail.com";
}

export type MailAttachment = {
  filename: string;
  content: string; // base64-encoded
  contentType?: string;
};

export type SendMailArgs = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
  attachments?: MailAttachment[];
};

export type SendResult =
  | { ok: true; skipped?: boolean; messageId?: string }
  | { ok: false; error: string };

/**
 * Send one email. Resolves `{ ok: false }` on failure (nodemailer throws,
 * we normalize) and `{ ok: true, skipped: true }` when SMTP isn't configured.
 * Callers decide whether a given message is blocking or best-effort.
 */
export async function sendMail(args: SendMailArgs): Promise<SendResult> {
  const tx = getTransport();
  if (!tx) {
    console.warn("[mail] SMTP not configured; skipping send.", {
      to: args.to,
      subject: args.subject,
    });
    return { ok: true, skipped: true };
  }
  try {
    const info = await tx.sendMail({
      from: args.from ?? mailFrom(),
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
      attachments: args.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        encoding: "base64",
        contentType: a.contentType ?? "application/pdf",
      })),
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    const error =
      err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
    return { ok: false, error };
  }
}
