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
import { siteConfig } from "@/lib/site-config";

// Mirrors the site's @theme tokens — keep these in sync if the site palette
// shifts. Email clients can't load Geist (it's a webfont), so we use a
// system stack that visually approximates it.
export const EMAIL_COLORS = {
  brand: "#ff6a00",
  brandSoft: "#ff8a3d",
  bg: "#07080a", // matches --color-ink
  surface: "#14171c", // matches --color-surface
  surface2: "#1b1f26", // matches --color-surface-2
  border: "#252a32", // visible border on dark
  fg: "#f5f6f7",
  muted: "#a3a7ad",
  muted2: "#6b7077",
} as const;

export const EMAIL_FONT_STACK =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

type Props = {
  preview: string;
  children: React.ReactNode;
};

export function EmailLayout({ preview, children }: Props) {
  // Email clients can only display images served from a public HTTPS URL.
  // In dev (and before the site is deployed to its real domain), there's no
  // such URL, so we fall back to a CSS "LA" badge that renders in every
  // email client without needing image hosting.
  // Set EMAIL_LOGO_URL once the logo is hosted publicly (deployed site,
  // CDN, etc.) and the real image will be used instead.
  const logoSrc = process.env.EMAIL_LOGO_URL?.trim() || null;
  return (
    <Html lang="en">
      <Head>
        {/* Hints for clients that support color-scheme media queries (Apple Mail,
            Outlook 2019+). Gmail does its own thing but generally renders well. */}
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark light" />
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
          {/* Thin orange top accent — the site's signature swoosh translated to email */}
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
                        alt="LA Digital"
                        style={{
                          display: "block",
                          backgroundColor: "#ffffff",
                          borderRadius: 8,
                          padding: 4,
                        }}
                      />
                    ) : (
                      // CSS-only "LA" badge — a white pill with bold black "LA"
                      // and an orange swoosh, mirroring the brand logo. Works
                      // in 100% of email clients without an image host.
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
                                LA
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
                      LA Digital
                    </Text>
                    <Text
                      style={{
                        margin: 0,
                        color: EMAIL_COLORS.muted,
                        fontSize: 11,
                        letterSpacing: 1.6,
                        textTransform: "uppercase",
                      }}
                    >
                      Web · Apps · AI
                    </Text>
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
              {siteConfig.company.legalName} · {siteConfig.contact.city}, {siteConfig.contact.region}
            </Text>
            <Text style={{ margin: "4px 0 0", fontSize: 12, color: EMAIL_COLORS.muted, lineHeight: 1.6 }}>
              <Link href={`mailto:${siteConfig.contact.email}`} style={{ color: EMAIL_COLORS.brand, textDecoration: "none" }}>
                {siteConfig.contact.email}
              </Link>
              {siteConfig.contact.phone ? (
                <>
                  {" · "}
                  <span style={{ color: EMAIL_COLORS.muted }}>{siteConfig.contact.phone}</span>
                </>
              ) : null}
            </Text>
            <Text style={{ margin: "12px 0 0", fontSize: 11, color: EMAIL_COLORS.muted2, lineHeight: 1.5 }}>
              You're receiving this because you contacted {siteConfig.company.name}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
