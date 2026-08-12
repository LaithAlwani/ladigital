import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { emailPalette, emailFontStack, type BrandConfig } from "@ladigital/theme";

export type EmailColors = ReturnType<typeof emailPalette>;

// The email shell is a factory instead of a fixed component: emails can't read
// CSS vars, so each app binds this to its own BrandConfig (packages/theme) and
// gets an EmailLayout + concrete palette that always match the live theme.
export function createEmailKit(brand: BrandConfig) {
  const EMAIL_COLORS = emailPalette(brand.colors);
  const EMAIL_FONT_STACK = emailFontStack(brand.fonts);

  function EmailLayout({
    preview,
    children,
  }: {
    preview: string;
    children: React.ReactNode;
  }) {
    // Email clients can only display images served from a public HTTPS URL.
    // Before the site is deployed to its real domain there's no such URL, so we
    // fall back to a CSS initials badge that renders in every email client
    // without needing image hosting.
    const logoSrc = brand.identity.logoUrl || null;
    const initials =
      brand.identity.wordmarkInitials || brand.identity.name.slice(0, 2).toUpperCase();
    return (
      <Html lang="en">
        <Head>
          {/* Hints for clients that support color-scheme media queries (Apple Mail,
              Outlook 2019+). Gmail does its own thing but generally renders well. */}
          <meta name="color-scheme" content="light" />
          <meta name="supported-color-schemes" content="light dark" />
        </Head>
        <Preview>{preview}</Preview>
        <Body
          style={{
            backgroundColor: EMAIL_COLORS.bg,
            fontFamily: EMAIL_FONT_STACK,
            margin: 0,
            padding: "32px 0",
            color: EMAIL_COLORS.fg,
            WebkitFontSmoothing: "antialiased",
          }}
        >
          <Container
            style={{
              maxWidth: 560,
              margin: "0 auto",
              backgroundColor: EMAIL_COLORS.surface,
              borderRadius: 16,
              overflow: "hidden",
              border: `1px solid ${EMAIL_COLORS.border}`,
            }}
          >
            {/* Thin brand top accent — the site's signature swoosh translated to email */}
            <div style={{ height: 3, backgroundColor: EMAIL_COLORS.brand, lineHeight: "3px", fontSize: 0 }}>
              &nbsp;
            </div>

            {/* Header band with logo + wordmark */}
            <Section style={{ padding: "20px 28px", backgroundColor: EMAIL_COLORS.bg }}>
              <table
                width="100%"
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                style={{ borderCollapse: "collapse" }}
              >
                <tbody>
                  <tr>
                    <td align="left" valign="middle" style={{ width: 44 }}>
                      {logoSrc ? (
                        <Img
                          src={logoSrc}
                          width={40}
                          height={40}
                          alt={brand.identity.name}
                          style={{
                            display: "block",
                            backgroundColor: "#ffffff",
                            borderRadius: 8,
                            padding: 4,
                          }}
                        />
                      ) : (
                        // CSS-only initials badge — a white pill with bold black
                        // initials and a brand swoosh. Works in 100% of email
                        // clients without an image host.
                        <table
                          role="presentation"
                          cellPadding={0}
                          cellSpacing={0}
                          style={{
                            backgroundColor: "#ffffff",
                            borderRadius: 8,
                            borderCollapse: "separate",
                          }}
                        >
                          <tbody>
                            <tr>
                              <td
                                align="center"
                                valign="middle"
                                style={{
                                  width: 40,
                                  height: 40,
                                  padding: "6px 5px 4px",
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  style={{
                                    fontFamily: "'Arial Black', Impact, Arial, sans-serif",
                                    fontSize: 18,
                                    fontWeight: 900,
                                    color: "#000000",
                                    lineHeight: 1,
                                    letterSpacing: -1,
                                  }}
                                >
                                  {initials}
                                </div>
                                <div
                                  style={{
                                    height: 3,
                                    width: 18,
                                    margin: "4px auto 0",
                                    backgroundColor: EMAIL_COLORS.brand,
                                    borderRadius: 2,
                                    lineHeight: "3px",
                                    fontSize: 0,
                                  }}
                                >
                                  &nbsp;
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      )}
                    </td>
                    <td align="left" valign="middle" style={{ paddingLeft: 12 }}>
                      <Text
                        style={{
                          margin: 0,
                          color: EMAIL_COLORS.fg,
                          fontSize: 14,
                          fontWeight: 600,
                          letterSpacing: 0.3,
                        }}
                      >
                        {brand.identity.name}
                      </Text>
                      {brand.identity.tagline ? (
                        <Text
                          style={{
                            margin: 0,
                            color: EMAIL_COLORS.muted,
                            fontSize: 11,
                            letterSpacing: 1.6,
                            textTransform: "uppercase",
                          }}
                        >
                          {brand.identity.tagline}
                        </Text>
                      ) : null}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* Body */}
            <Section style={{ padding: "28px 28px 32px", backgroundColor: EMAIL_COLORS.surface }}>
              {children}
            </Section>

            {/* Footer */}
            <Hr style={{ border: "none", borderTop: `1px solid ${EMAIL_COLORS.border}`, margin: 0 }} />
            <Section style={{ padding: "20px 28px", backgroundColor: EMAIL_COLORS.bg }}>
              <Text style={{ margin: 0, fontSize: 12, color: EMAIL_COLORS.muted, lineHeight: 1.6 }}>
                {brand.identity.legalName}
                {brand.contact.city ? ` · ${brand.contact.city}, ${brand.contact.region}` : ""}
              </Text>
              <Text style={{ margin: "4px 0 0", fontSize: 12, color: EMAIL_COLORS.muted, lineHeight: 1.6 }}>
                <Link href={`mailto:${brand.contact.email}`} style={{ color: EMAIL_COLORS.brand, textDecoration: "none" }}>
                  {brand.contact.email}
                </Link>
                {brand.contact.phone ? (
                  <>
                    {" · "}
                    <span style={{ color: EMAIL_COLORS.muted }}>{brand.contact.phone}</span>
                  </>
                ) : null}
              </Text>
              <Text style={{ margin: "12px 0 0", fontSize: 11, color: EMAIL_COLORS.muted2, lineHeight: 1.5 }}>
                You&apos;re receiving this because you contacted {brand.identity.name}.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  }

  return { EMAIL_COLORS, EMAIL_FONT_STACK, EmailLayout };
}
