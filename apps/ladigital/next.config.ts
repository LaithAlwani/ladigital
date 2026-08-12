import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship raw TS/TSX — let Next transpile them.
  transpilePackages: [
    "@ladigital/theme",
    "@ladigital/ui",
    "@ladigital/admin-kit",
    "@ladigital/email",
    "@ladigital/booking",
  ],
  images: {
    // AVIF cuts bytes ~30% over WebP on photographic content; Next.js falls
    // back to WebP and then the original automatically for older clients.
    formats: ["image/avif", "image/webp"],
    // One year — optimized variants are immutable per source hash.
    minimumCacheTTL: 31_536_000,
  },
  // Old pricing surfaces were folded into the home page during the reposition.
  // Keep any indexed/inbound links working by sending them to the home anchors.
  async redirects() {
    return [
      { source: "/services", destination: "/#services", permanent: true },
      { source: "/plans/:slug", destination: "/#websites", permanent: true },
    ];
  },
};

export default nextConfig;
