"use server";

import { render } from "@react-email/components";
import { contactSchema, type ContactActionState, BUDGET_VALUES } from "@/lib/schemas";
import { sendMail } from "@/lib/mailer";
import { siteConfig } from "@/lib/site-config";
import ContactNotification from "@/emails/contact-notification";
import ContactConfirmation from "@/emails/contact-confirmation";

export async function submitContact(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;

  const budgetRaw = raw.budget?.trim();
  const budget = budgetRaw && (BUDGET_VALUES as readonly string[]).includes(budgetRaw) ? budgetRaw : "";

  const parsed = contactSchema.safeParse({
    name: raw.name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    company: raw.company ?? "",
    service: raw.service ?? "",
    budget,
    message: raw.message ?? "",
    website: raw.website ?? "",
    consent: raw.consent === "on" || raw.consent === "true",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Honeypot tripped → pretend success.
  if (parsed.data.website) {
    return { status: "success", message: "Thanks — we'll be in touch." };
  }

  // Step 1: pre-render both templates to HTML. Doing this before send()
  // surfaces render errors clearly (separate from delivery errors).
  let notificationHtml: string;
  let confirmationHtml: string;
  try {
    [notificationHtml, confirmationHtml] = await Promise.all([
      render(ContactNotification({ data: parsed.data })),
      render(ContactConfirmation({ data: parsed.data })),
    ]);
  } catch (err) {
    console.error(
      "[contact] email render failed:",
      err instanceof Error ? `${err.message}\n${err.stack}` : err,
    );
    return {
      status: "error",
      message: "We couldn't prepare your message. Please email us directly.",
    };
  }

  // Step 2: send both emails. The business notification is blocking (it has to
  // land); the user confirmation is best-effort (logged, non-blocking).
  const [notify, confirm] = await Promise.all([
    sendMail({
      to: siteConfig.mail.toEmail,
      replyTo: parsed.data.email,
      subject: `New inquiry — ${parsed.data.name}${parsed.data.service ? ` (${parsed.data.service})` : ""}`,
      html: notificationHtml,
    }),
    sendMail({
      to: parsed.data.email,
      subject: `Thanks for reaching out to ${siteConfig.company.name}`,
      html: confirmationHtml,
    }),
  ]);

  if (!notify.ok) {
    console.error("[contact] business notification failed:", notify.error);
    return {
      status: "error",
      message: `We couldn't send your message right now. Please email ${siteConfig.contact.email} directly.`,
    };
  }
  if (!confirm.ok) {
    console.warn("[contact] user confirmation failed (non-blocking):", confirm.error);
  }

  return {
    status: "success",
    message: "Thanks — we'll be in touch within one business day.",
  };
}
