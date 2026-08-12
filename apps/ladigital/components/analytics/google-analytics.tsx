import Script from "next/script";

/**
 * Google Analytics 4 (gtag.js).
 *
 * - Loaded via `next/script` with `strategy="afterInteractive"` so it never
 *   blocks hydration. This is the equivalent of Google's official snippet
 *   but plays nicely with the React 19 / App Router lifecycle.
 * - Reads the measurement ID from `NEXT_PUBLIC_GA_MEASUREMENT_ID`. If the
 *   env var is empty, nothing renders — useful for dev/preview deploys.
 * - Measurement IDs are public (they're served in HTML to every visitor),
 *   so the env var is `NEXT_PUBLIC_` by design.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
