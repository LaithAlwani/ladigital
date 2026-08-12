import "server-only";
import fs from "node:fs";
import path from "node:path";
import { renderInvoiceToDoc, type InvoicePdfData, type InvoiceLogo } from "@/lib/invoice-pdf-core";

export type { InvoicePdfData };

/** Read width/height from a JPEG's SOF marker (so the logo isn't distorted). */
function jpegSize(buf: Buffer): { width: number; height: number } | null {
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    // SOF0..SOF15 (excluding DHT/JPG/DAC) carry the frame dimensions.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

let cached: InvoiceLogo | undefined;
function loadLogo(): InvoiceLogo {
  if (cached !== undefined) return cached;
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "invoice-logo.jpg"));
    const size = jpegSize(buf);
    cached = {
      dataUrl: `data:image/jpeg;base64,${buf.toString("base64")}`,
      aspect: size ? size.width / Math.max(1, size.height) : 1,
    };
  } catch {
    cached = null;
  }
  return cached;
}

/** Generate the invoice PDF on the server and return its raw base64. */
export function invoicePdfBase64Server(data: InvoicePdfData): string {
  const doc = renderInvoiceToDoc(data, loadLogo());
  const uri = doc.output("datauristring");
  return uri.substring(uri.indexOf("base64,") + 7);
}
