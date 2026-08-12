import { Heading, Text, Section } from "@react-email/components";
import * as React from "react";
import { siteConfig } from "@/lib/site-config";
import { EmailLayout, EMAIL_COLORS } from "./components/email-layout";

type Props = {
  clientName: string;
  number: string;
  totalText: string;
  dueText: string;
  notes?: string;
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  color: EMAIL_COLORS.brand,
  letterSpacing: 1.8,
  textTransform: "uppercase",
  fontWeight: 700,
};

const headingStyle: React.CSSProperties = {
  margin: "8px 0 12px",
  fontSize: 26,
  color: EMAIL_COLORS.fg,
  fontWeight: 600,
  lineHeight: 1.2,
};

const bodyTextStyle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: 15,
  color: EMAIL_COLORS.fg,
  lineHeight: 1.65,
};

const metaLabel: React.CSSProperties = {
  margin: 0,
  fontSize: 10,
  color: EMAIL_COLORS.muted2,
  letterSpacing: 1.6,
  textTransform: "uppercase",
  fontWeight: 600,
};

export default function InvoiceEmail({ clientName, number, totalText, dueText, notes }: Props) {
  const first = (clientName.split(" ")[0] || clientName || "there").trim();
  return (
    <EmailLayout preview={`Invoice ${number} — ${totalText} due ${dueText}`}>
      <Text style={eyebrowStyle}>Invoice {number}</Text>
      <Heading as="h1" style={headingStyle}>
        Here&apos;s your invoice, {first}.
      </Heading>
      <Text style={bodyTextStyle}>
        Thanks for working with {siteConfig.company.name}. Your invoice is attached as a PDF — the
        summary is below.
      </Text>

      <Section
        style={{
          marginTop: 8,
          padding: 18,
          backgroundColor: EMAIL_COLORS.surface2,
          borderRadius: 12,
          border: `1px solid ${EMAIL_COLORS.border}`,
        }}
      >
        <table width="100%" role="presentation" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td>
                <Text style={metaLabel}>Total Due</Text>
                <Text style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 700, color: EMAIL_COLORS.fg }}>
                  {totalText}
                </Text>
              </td>
              <td align="right" style={{ verticalAlign: "top" }}>
                <Text style={metaLabel}>Due date</Text>
                <Text style={{ margin: "6px 0 0", fontSize: 14, color: EMAIL_COLORS.fg }}>{dueText}</Text>
              </td>
            </tr>
          </tbody>
        </table>
        {notes?.trim() ? (
          <Text style={{ margin: "14px 0 0", fontSize: 13, color: EMAIL_COLORS.muted, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {notes.trim()}
          </Text>
        ) : null}
      </Section>

      <Text style={{ margin: "20px 0 0", fontSize: 13, color: EMAIL_COLORS.muted, lineHeight: 1.6 }}>
        Questions about this invoice? Just reply to this email.
      </Text>
      <Text style={{ margin: "18px 0 0", fontSize: 13, color: EMAIL_COLORS.fg, lineHeight: 1.5 }}>
        — The {siteConfig.company.name} team
      </Text>
    </EmailLayout>
  );
}
