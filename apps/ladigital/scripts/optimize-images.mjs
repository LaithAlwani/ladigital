/**
 * One-time image optimizer for /public.
 *
 * - Targets every *.jpg / *.jpeg / *.png in /public (excluding the existing
 *   logo files, which are already small).
 * - Resizes to a max of 1600px on the longer edge (plenty for full-bleed
 *   hero/section images; Next.js Image will resample further per request).
 * - Re-encodes JPEGs at quality 82 with mozjpeg + progressive scan.
 * - Re-encodes PNGs at compressionLevel 9.
 * - Backs the original up to public/_originals/<filename> before overwriting.
 *   Subsequent runs skip a file if it's already been processed.
 *
 * Run: `npm run optimize:images`
 */
import { mkdir, readdir, stat, copyFile } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import sharp from "sharp";

const PUBLIC_DIR = new URL("../public/", import.meta.url).pathname.replace(
  // Normalise the Windows leading slash from URL.pathname
  /^\/([A-Za-z]:)/,
  "$1",
);
const BACKUP_DIR = join(PUBLIC_DIR, "_originals");

const SKIP = new Set([
  "logo_300dpi.png",
  "logo_300dpi.webp",
  "favicon.ico",
  "og-default.png",
  "og-presence.png",
  "og-growth.png",
  "og-scale.png",
]);
const MAX_EDGE = 1600;
const JPEG_QUALITY = 82;

const SUPPORTED = new Set([".jpg", ".jpeg", ".png"]);

function fmtBytes(n) {
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  if (n > 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

async function optimize() {
  await ensureDir(BACKUP_DIR);
  const entries = await readdir(PUBLIC_DIR);
  let processed = 0;
  let savedBytes = 0;

  for (const name of entries) {
    if (SKIP.has(name)) continue;
    if (name.startsWith("_")) continue;
    const ext = extname(name).toLowerCase();
    if (!SUPPORTED.has(ext)) continue;

    const srcPath = join(PUBLIC_DIR, name);
    const backupPath = join(BACKUP_DIR, name);

    // Skip files that are already backed up (assume already-optimized).
    try {
      await stat(backupPath);
      console.log(`• ${name} — already optimized (backup exists), skipping`);
      continue;
    } catch {
      // No backup yet — proceed.
    }

    const before = (await stat(srcPath)).size;
    await copyFile(srcPath, backupPath);

    const pipeline = sharp(backupPath).rotate().resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    });

    const out =
      ext === ".png"
        ? pipeline.png({ compressionLevel: 9, palette: true })
        : pipeline.jpeg({
            quality: JPEG_QUALITY,
            mozjpeg: true,
            progressive: true,
          });

    await out.toFile(srcPath + ".tmp");

    // Atomic replace: use copyFile + unlink path so Windows doesn't complain
    // about file-in-use from concurrent watchers.
    const { rename, unlink } = await import("node:fs/promises");
    try {
      await unlink(srcPath);
    } catch {
      // ignore
    }
    await rename(srcPath + ".tmp", srcPath);

    const after = (await stat(srcPath)).size;
    savedBytes += before - after;
    processed += 1;

    const pct = ((1 - after / before) * 100).toFixed(0);
    console.log(
      `✓ ${basename(name).padEnd(20)} ${fmtBytes(before).padStart(10)} → ${fmtBytes(after).padStart(10)} (-${pct}%)`,
    );
  }

  console.log("");
  console.log(
    `Done. ${processed} file(s) processed, ${fmtBytes(savedBytes)} saved.`,
  );
  console.log(`Originals backed up to: ${BACKUP_DIR}`);
}

optimize().catch((err) => {
  console.error("optimize-images failed:", err);
  process.exit(1);
});
