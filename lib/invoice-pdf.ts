import {
  renderInvoiceToDoc,
  type InvoicePdfData,
  type InvoiceLogo,
} from "@/lib/invoice-pdf-core";

export type { InvoicePdfData };

// Load the pre-encoded small logo (public/invoice-logo.jpg) as base64 + aspect.
// Keeping it a tiny JPEG is what stops the PDF from ballooning to MBs.
async function loadLogo(): Promise<InvoiceLogo> {
  try {
    const res = await fetch("/invoice-logo.jpg");
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    const aspect = await new Promise<number>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth / Math.max(1, img.naturalHeight));
      img.onerror = () => resolve(1);
      img.src = dataUrl;
    });
    return { dataUrl, aspect };
  } catch {
    return null;
  }
}

/** Build and download the invoice PDF in the browser. */
export async function generateInvoicePdf(data: InvoicePdfData): Promise<void> {
  const doc = renderInvoiceToDoc(data, await loadLogo());
  doc.save(`${data.number}.pdf`);
}

/** Build the invoice PDF and return its raw base64 (for emailing as an attachment). */
export async function invoicePdfBase64(data: InvoicePdfData): Promise<string> {
  const doc = renderInvoiceToDoc(data, await loadLogo());
  const uri = doc.output("datauristring");
  return uri.substring(uri.indexOf("base64,") + 7);
}
