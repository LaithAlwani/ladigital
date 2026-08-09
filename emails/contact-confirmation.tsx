import { Heading, Link, Section, Text, Hr, Button } from "@react-email/components";
import * as React from "react";
import type { ContactInput } from "@/lib/schemas";
import { siteConfig } from "@/lib/site-config";
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

const headingStyle: React.CSSProperties = {
  margin: "8px 0 12px",
  fontSize: 26,
  color: EMAIL_COLORS.fg,
  fontWeight: 600,
  lineHeight: 1.2,
  letterSpacing: -0.3,
};

const bodyTextStyle: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: 15,
  color: EMAIL_COLORS.fg,
  lineHeight: 1.65,
};

export default function ContactConfirmation({ data }: Props) {
  const firstName = (data.name.split(" ")[0] || data.name).trim();
  return (
    <EmailLayout preview={`Thanks for reaching out, ${firstName} — we got your message.`}>
      <Text style={eyebrowStyle}>Message received</Text>
      <Heading as="h1" style={headingStyle}>
        Thanks, {firstName} — we've got it.
      </Heading>

      <Text style={bodyTextStyle}>
        We'll review your project and reply within one business day. If it's urgent in the meantime,
        you can reach us at{" "}
        <Link href={`mailto:${siteConfig.contact.email}`} style={{ color: EMAIL_COLORS.brand, textDecoration: "none" }}>
          {siteConfig.contact.email}
        </Link>
        .
      </Text>

      {/* Recap card */}
      <Section
        style={{
          marginTop: 8,
          padding: 18,
          backgroundColor: EMAIL_COLORS.surface2,
          borderRadius: 12,
          border: `1px solid ${EMAIL_COLORS.border}`,
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: 10,
            color: EMAIL_COLORS.muted2,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          What you sent us
        </Text>
        {data.service ? (
          <Text style={{ margin: "10px 0 0", fontSize: 13, color: EMAIL_COLORS.fg, lineHeight: 1.5 }}>
            <strong style={{ color: EMAIL_COLORS.muted }}>Service:</strong> {data.service}
          </Text>
        ) : null}
        {data.budget ? (
          <Text style={{ margin: "4px 0 0", fontSize: 13, color: EMAIL_COLORS.fg, lineHeight: 1.5 }}>
            <strong style={{ color: EMAIL_COLORS.muted }}>Budget:</strong> {data.budget}
          </Text>
        ) : null}
        <Text
          style={{
            margin: "12px 0 0",
            fontSize: 13,
            color: EMAIL_COLORS.fg,
            whiteSpace: "pre-wrap",
            lineHeight: 1.65,
          }}
        >
          {data.message}
        </Text>
      </Section>

      {/* What happens next */}
      <Section style={{ marginTop: 28 }}>
        <Text
          style={{
            margin: 0,
            fontSize: 10,
            color: EMAIL_COLORS.muted2,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          What happens next
        </Text>
        <Text style={{ margin: "10px 0 0", fontSize: 14, color: EMAIL_COLORS.fg, lineHeight: 1.65 }}>
          <strong style={{ color: EMAIL_COLORS.brand }}>1.</strong> We review your project and put together a fixed-price quote.
          <br />
          <strong style={{ color: EMAIL_COLORS.brand }}>2.</strong> We email you a proposal within one business day.
          <br />
          <strong style={{ color: EMAIL_COLORS.brand }}>3.</strong> If it works, we schedule a kickoff call and get started.
        </Text>
      </Section>

      <Section style={{ marginTop: 28 }}>
        <Button
          href={`${siteConfig.seo.siteUrl}/#services`}
          style={{
            backgroundColor: "transparent",
            color: EMAIL_COLORS.fg,
            padding: "12px 22px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-block",
            border: `1px solid ${EMAIL_COLORS.border}`,
          }}
        >
          Browse all packages →
        </Button>
      </Section>

      <Hr style={{ border: "none", borderTop: `1px solid ${EMAIL_COLORS.border}`, margin: "28px 0 18px" }} />

      <Text style={{ margin: 0, fontSize: 13, color: EMAIL_COLORS.muted, lineHeight: 1.65 }}>
        Follow along —{" "}
        {siteConfig.socials.map((s, i) => (
          <React.Fragment key={s.platform}>
            <Link href={s.url} style={{ color: EMAIL_COLORS.brand, textDecoration: "none" }}>
              {s.platform[0].toUpperCase() + s.platform.slice(1)}
            </Link>
            {i < siteConfig.socials.length - 1 ? <span style={{ color: EMAIL_COLORS.muted2 }}> · </span> : null}
          </React.Fragment>
        ))}
      </Text>
      <Text style={{ margin: "18px 0 0", fontSize: 13, color: EMAIL_COLORS.fg, lineHeight: 1.5 }}>
        — The {siteConfig.company.name} team
      </Text>
    </EmailLayout>
  );
}
