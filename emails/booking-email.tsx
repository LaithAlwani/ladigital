import { Heading, Link, Section, Text, Hr, Button } from "@react-email/components";
import * as React from "react";
import { siteConfig } from "@/lib/site-config";
import { EmailLayout, EMAIL_COLORS } from "./components/email-layout";

export type BookingEmailKind = "confirmed" | "rescheduled" | "cancelled";
export type BookingEmailRole = "client" | "owner";

export type BookingEmailProps = {
  kind: BookingEmailKind;
  role: BookingEmailRole;
  name: string;
  whenText: string;
  previousWhenText?: string;
  meetLink?: string;
  manageUrl?: string;
  // Owner-notification extras.
  email?: string;
  phone?: string;
  company?: string;
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
  letterSpacing: -0.3,
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

function copyFor(kind: BookingEmailKind, role: BookingEmailRole, first: string) {
  if (role === "owner") {
    const verb =
      kind === "confirmed" ? "New booking" : kind === "rescheduled" ? "Booking moved" : "Booking cancelled";
    return {
      eyebrow: verb,
      heading: `${verb} — ${first}`,
      lede:
        kind === "cancelled"
          ? `${first} cancelled their discovery call. The slot is open again.`
          : `${first} ${kind === "confirmed" ? "booked" : "rescheduled"} a discovery call. Details below.`,
    };
  }
  if (kind === "confirmed")
    return {
      eyebrow: "Booking confirmed",
      heading: `You're booked, ${first}.`,
      lede: "Your discovery call is confirmed. Here are the details — we're looking forward to it.",
    };
  if (kind === "rescheduled")
    return {
      eyebrow: "Booking updated",
      heading: `New time confirmed, ${first}.`,
      lede: "Your discovery call has been moved. Here are the updated details.",
    };
  return {
    eyebrow: "Booking cancelled",
    heading: `Your call is cancelled, ${first}.`,
    lede: "Your discovery call has been cancelled. No problem — you can rebook anytime.",
  };
}

export default function BookingEmail(props: BookingEmailProps) {
  const { kind, role, name, whenText, previousWhenText, meetLink, manageUrl } = props;
  const first = (name.split(" ")[0] || name).trim();
  const c = copyFor(kind, role, first);
  const cancelled = kind === "cancelled";

  return (
    <EmailLayout preview={`${c.eyebrow} — ${whenText}`}>
      <Text style={eyebrowStyle}>{c.eyebrow}</Text>
      <Heading as="h1" style={headingStyle}>
        {c.heading}
      </Heading>
      <Text style={bodyTextStyle}>{c.lede}</Text>

      {/* Details card */}
      <Section
        style={{
          marginTop: 8,
          padding: 18,
          backgroundColor: EMAIL_COLORS.surface2,
          borderRadius: 12,
          border: `1px solid ${EMAIL_COLORS.border}`,
        }}
      >
        <Text style={metaLabel}>When</Text>
        <Text
          style={{
            margin: "8px 0 0",
            fontSize: 16,
            color: EMAIL_COLORS.fg,
            fontWeight: 600,
            lineHeight: 1.4,
            textDecoration: cancelled ? "line-through" : "none",
          }}
        >
          {whenText}
        </Text>
        {previousWhenText ? (
          <Text style={{ margin: "6px 0 0", fontSize: 12, color: EMAIL_COLORS.muted2 }}>
            Previously: <span style={{ textDecoration: "line-through" }}>{previousWhenText}</span>
          </Text>
        ) : null}

        {!cancelled && meetLink ? (
          <>
            <Text style={{ ...metaLabel, marginTop: 16 }}>Google Meet</Text>
            <Text style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.5 }}>
              <Link href={meetLink} style={{ color: EMAIL_COLORS.brand, textDecoration: "none" }}>
                {meetLink}
              </Link>
            </Text>
          </>
        ) : null}

        {role === "owner" ? (
          <Section style={{ marginTop: 16 }}>
            <Text style={metaLabel}>Contact</Text>
            {props.email ? (
              <Text style={{ margin: "8px 0 0", fontSize: 13, color: EMAIL_COLORS.fg, lineHeight: 1.5 }}>
                <strong style={{ color: EMAIL_COLORS.muted }}>Email:</strong>{" "}
                <Link href={`mailto:${props.email}`} style={{ color: EMAIL_COLORS.brand, textDecoration: "none" }}>
                  {props.email}
                </Link>
              </Text>
            ) : null}
            {props.phone ? (
              <Text style={{ margin: "4px 0 0", fontSize: 13, color: EMAIL_COLORS.fg, lineHeight: 1.5 }}>
                <strong style={{ color: EMAIL_COLORS.muted }}>Phone:</strong> {props.phone}
              </Text>
            ) : null}
            {props.company ? (
              <Text style={{ margin: "4px 0 0", fontSize: 13, color: EMAIL_COLORS.fg, lineHeight: 1.5 }}>
                <strong style={{ color: EMAIL_COLORS.muted }}>Company:</strong> {props.company}
              </Text>
            ) : null}
            {props.notes ? (
              <Text
                style={{
                  margin: "10px 0 0",
                  fontSize: 13,
                  color: EMAIL_COLORS.fg,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                }}
              >
                {props.notes}
              </Text>
            ) : null}
          </Section>
        ) : null}
      </Section>

      {/* CTAs */}
      {role === "client" && !cancelled && meetLink ? (
        <Section style={{ marginTop: 24 }}>
          <Button
            href={meetLink}
            style={{
              backgroundColor: EMAIL_COLORS.brand,
              color: "#ffffff",
              padding: "12px 22px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Join Google Meet →
          </Button>
        </Section>
      ) : null}

      {role === "client" && !cancelled && manageUrl ? (
        <Text style={{ margin: "20px 0 0", fontSize: 13, color: EMAIL_COLORS.muted, lineHeight: 1.6 }}>
          Need to change it?{" "}
          <Link href={manageUrl} style={{ color: EMAIL_COLORS.brand, textDecoration: "none" }}>
            Reschedule or cancel
          </Link>
          .
        </Text>
      ) : null}

      {role === "client" && cancelled ? (
        <Section style={{ marginTop: 24 }}>
          <Button
            href={`${siteConfig.seo.siteUrl}/book`}
            style={{
              backgroundColor: EMAIL_COLORS.brand,
              color: "#ffffff",
              padding: "12px 22px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Book a new time →
          </Button>
        </Section>
      ) : null}

      <Hr style={{ border: "none", borderTop: `1px solid ${EMAIL_COLORS.border}`, margin: "28px 0 18px" }} />
      <Text style={{ margin: 0, fontSize: 13, color: EMAIL_COLORS.fg, lineHeight: 1.5 }}>
        — The {siteConfig.company.name} team
      </Text>
    </EmailLayout>
  );
}
