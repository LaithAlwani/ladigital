import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { LeoWidget } from "@/components/leo/leo-widget";
import { JsonLd } from "@/components/seo/json-ld";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { SocialsProvider } from "@/components/providers/socials-provider";
import { PublicChrome } from "@/components/layout/public-chrome";
import { organizationLd, localBusinessLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getSettings } from "@/lib/get-settings";
import { resolveSocials } from "@/lib/socials";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.seo.siteUrl),
  title: {
    default: siteConfig.seo.defaultTitle,
    template: siteConfig.seo.titleTemplate,
  },
  description: siteConfig.seo.defaultDescription,
  keywords: siteConfig.seo.keywords,
  applicationName: siteConfig.company.name,
  authors: [{ name: siteConfig.company.legalName }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.company.locale,
    url: siteConfig.seo.siteUrl,
    siteName: siteConfig.company.name,
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
    images: [
      {
        url: siteConfig.seo.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.company.name} — ${siteConfig.company.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
    images: [siteConfig.seo.ogImage],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo_300dpi.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // TODO: once you've claimed the property in Google Search Console + Bing,
  // add the verification codes here. Both accept multiple codes per service.
  // verification: { google: "...", other: { "msvalidate.01": "..." } },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const socials = resolveSocials(settings?.socials, siteConfig.socials);

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-ink text-foreground">
        <ConvexClientProvider>
          <SocialsProvider value={socials}>
            <JsonLd data={[organizationLd(), localBusinessLd()]} />
            <PublicChrome>
              <SiteHeader />
            </PublicChrome>
            <main className="flex-1">{children}</main>
            <PublicChrome>
              <SiteFooter />
              <LeoWidget />
            </PublicChrome>
            <GoogleAnalytics />
          </SocialsProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
