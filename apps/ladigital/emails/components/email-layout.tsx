// The email shell now lives in @ladigital/email. Bind it to this site's
// BrandConfig once here so every email (booking, invoice, contact) imports the
// same themed EmailLayout + palette from this path — no import churn.
import { createEmailKit } from "@ladigital/email";
import { brand } from "@/lib/brand";

export const { EmailLayout, EMAIL_COLORS, EMAIL_FONT_STACK } = createEmailKit(brand);
