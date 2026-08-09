import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

/**
 * Lists every URL Google should crawl. Static export — runs at build time
 * and on dev hits. The home page carries the offer/pricing, so it's the
 * primary crawlable surface alongside the legal pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.seo.siteUrl.replace(/\/$/, "");
  const now = new Date();

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
