import { Button, Heading, Section, Text, Hr } from "@react-email/components";
import * as React from "react";
import type { ContactInput } from "@/lib/schemas";
import { EmailLayout, EMAIL_COLORS } from "./components/email-layout";

type Props = { data: ContactInput };

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  color: EMAIL_COLORS.brand,
  letterSpacing: 1.8,
  textTransform: "uppercase",
  fontWeight: 700,
};

const fieldLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 10,
  color: EMAIL_COLORS.muted2,
  letterSpacing: 1.6,
  textTransform: "uppercase",
  fontWeight: 600,
};

const fieldValueStyle: React.CSSProperties = {
  margin: "3px 0 0",
  fontSize: 14,
  color: EMAIL_COLORS.fg,
  lineHeight: 1.5,
};

export default function ContactNotification({ data }: Props) {
  const submittedAt = new Date().toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Toronto",
  });
  const firstName = (data.name.split(" ")[0] || data.name).trim();

  return (
    <EmailLayout preview={`New inquiry from ${data.name}`}>
      <Text style={eyebrowStyle}>New Inquiry</Text>
      <Heading
        as="h1"
        style={{
          margin: "8px 0 6px",
          fontSize: 24,
          color: EMAIL_COLORS.fg,
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: -0.3,
        }}
      >
        {data.name} just reached out.
      </Heading>
      <Text style={{ margin: "0 0 24px", fontSize: 12, color: EMAIL_COLORS.muted2 }}>
        Received {submittedAt}
      </Text>

      <Section>
        <FieldRow label="Email" value={data.email} link={`mailto:${data.email}`} />
        {data.phone ? <FieldRow label="Phone" value={data.phone} link={`tel:${data.phone}`} /> : null}
        {data.company ? <FieldRow label="Company" value={data.company} /> : null}
        {data.service ? <FieldRow label="Service interest" value={data.service} /> : null}
        {data.budget ? <FieldRow label="Budget" value={data.budget} /> : null}
      </Section>

      <Hr style={{ border: "none", borderTop: `1px solid ${EMAIL_COLORS.border}`, margin: "20px 0" }} />

      <Text style={fieldLabelStyle}>Message</Text>
      <Section
        style={{
          marginTop: 10,
          padding: 18,
          backgroundColor: EMAIL_COLORS.surface2,
          borderRadius: 12,
          border: `1px solid ${EMAIL_COLORS.border}`,
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: 14,
            color: EMAIL_COLORS.fg,
            whiteSpace: "pre-wrap",
            lineHeight: 1.65,
          }}
        >
          {data.message}
        </Text>
      </Section>

      <Section style={{ marginTop: 28, textAlign: "left" }}>
        <Button
          href={`mailto:${data.email}?subject=${encodeURIComponent("Re: Your inquiry to LA Digital")}`}
          style={{
            backgroundColor: EMAIL_COLORS.brand,
            color: "#ffffff",
            padding: "13px 24px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-block",
            boxShadow: "0 8px 24px -10px rgba(255, 106, 0, 0.6)",
          }}
        >
          Reply to {firstName} →
        </Button>
      </Section>
    </EmailLayout>
  );
}

function FieldRow({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <Section style={{ marginBottom: 14 }}>
      <Text style={fieldLabelStyle}>{label}</Text>
      <Text style={fieldValueStyle}>
        {link ? (
          <a href={link} style={{ color: EMAIL_COLORS.fg, textDecoration: "none", borderBottom: `1px dashed ${EMAIL_COLORS.muted2}` }}>
            {value}
          </a>
        ) : (
          value
        )}
      </Text>
    </Section>
  );
}
