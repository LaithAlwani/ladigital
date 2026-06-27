// Capture a live screenshot of each given site and create a draft project from
// it (image + title + description). Screenshots need a real browser, so this
// runs locally (not in Convex).
//
// Usage:
//   node --env-file=.env.local scripts/import-projects.mjs https://site1.com https://site2.com
//
// Requires: npx playwright install chromium  (one-time)
// Reads NEXT_PUBLIC_CONVEX_URL + ADMIN_WRITE_KEY from .env.local.

import { chromium } from "playwright";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const adminKey = process.env.ADMIN_WRITE_KEY;

if (!convexUrl || !adminKey) {
  console.error(
    "Missing env. Run with:\n  node --env-file=.env.local scripts/import-projects.mjs <url> [url ...]",
  );
  process.exit(1);
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("Usage: node --env-file=.env.local scripts/import-projects.mjs https://a.com https://b.com");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);
const browser = await chromium.launch();

try {
  for (const raw of targets) {
    // Optional "url|status" form, e.g. "https://x.com|under-construction".
    const [urlPart, statusPart] = raw.split("|");
    let url = urlPart.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    const status = (statusPart || "live").trim();
    process.stdout.write(`📸 ${url} (${status}) … `);

    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });
    try {
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
      } catch {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      }
      // Let late hero images / fonts settle.
      await page.waitForTimeout(1500);

      const title = (await page.title().catch(() => "")) || new URL(url).hostname;
      const description = await page
        .$eval('meta[name="description"]', (el) => el.getAttribute("content") || "")
        .catch(() => "");
      const buf = await page.screenshot({ type: "png" }); // above-the-fold 1280×800
      await page.close();

      const uploadUrl = await client.mutation(api.projects.generateUploadUrl, { adminKey });
      const up = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: buf,
      });
      if (!up.ok) throw new Error(`upload failed (${up.status})`);
      const { storageId } = await up.json();

      const id = await client.mutation(api.projects.createFull, {
        adminKey,
        title: title.slice(0, 80),
        description: (description || "").slice(0, 500),
        url,
        status,
        images: [{ storageId }],
        published: false,
      });
      console.log(`✓ draft created (${id})`);
    } catch (err) {
      await page.close().catch(() => {});
      console.log(`✗ failed: ${err.message}`);
    }
  }
  console.log("\nDone. Review the drafts in /admin/projects, tidy the title/description, then Publish.");
} finally {
  await browser.close();
}
