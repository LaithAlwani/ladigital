import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.seo.siteUrl.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /api/* are server actions and internal endpoints — no crawl value.
        disallow: ["/api/", "/_originals/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
