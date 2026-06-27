import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { siteConfig } from "@/lib/site-config";
import { invoiceTotals, formatMoney, formatDate, type InvoiceItem } from "@/lib/invoice";

export type InvoicePdfData = {
  number: string;
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  clientAddress?: string;
  items: InvoiceItem[];
  taxRate: number;
  currency: string;
  issueDate: number;
  dueDate: number;
  notes?: string;
};

const ORANGE: [number, number, number] = [255, 106, 0];
const INK: [number, number, number] = [20, 23, 28];
const MUTED: [number, number, number] = [120, 128, 138];

function loadLogo(url: string): Promise<{ dataUrl: string; w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  const right = pageW - margin;

  // --- Header: logo + INVOICE title -------------------------------------
  const logo = await loadLogo("/logo_300dpi.png");
  let headerBottom = margin;
  if (logo) {
    const h = 44;
    const w = (logo.w / logo.h) * h;
    doc.addImage(logo.dataUrl, "PNG", margin, margin, w, h);
    headerBottom = margin + h;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...INK);
    doc.text(siteConfig.company.name, margin, margin + 20);
    headerBottom = margin + 24;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...ORANGE);
  doc.text("INVOICE", right, margin + 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(data.number, right, margin + 34, { align: "right" });

  // --- From (company) ----------------------------------------------------
  let y = headerBottom + 28;
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("FROM", margin, y);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(siteConfig.company.legalName, margin, y + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const fromLines = [
    siteConfig.contact.addressLine ?? `${siteConfig.contact.city}, ${siteConfig.contact.region}`,
    siteConfig.contact.email,
    siteConfig.contact.phone ?? "",
  ].filter(Boolean);
  doc.text(fromLines, margin, y + 30);

  // --- Bill To (client) --------------------------------------------------
  const billX = pageW / 2 + 10;
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("BILL TO", billX, y);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(data.clientCompany || data.clientName || "—", billX, y + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const toLines = [
    data.clientCompany ? data.clientName : "",
    data.clientAddress ?? "",
    data.clientEmail ?? "",
  ].filter(Boolean);
  doc.text(toLines, billX, y + 30);

  // --- Dates -------------------------------------------------------------
  y = y + 30 + Math.max(fromLines.length, toLines.length + 1) * 13 + 18;
  doc.setDrawColor(230, 232, 235);
  doc.line(margin, y, right, y);
  y += 18;
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("ISSUE DATE", margin, y);
  doc.text("DUE DATE", margin + 160, y);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(formatDate(data.issueDate), margin, y + 14);
  doc.text(formatDate(data.dueDate), margin + 160, y + 14);
  doc.setFont("helvetica", "normal");

  // --- Line items table --------------------------------------------------
  const { subtotal, tax, total } = invoiceTotals(data.items, data.taxRate);
  autoTable(doc, {
    startY: y + 34,
    margin: { left: margin, right: margin },
    head: [["Description", "Amount"]],
    body: data.items
      .filter((it) => it.description || it.amount)
      .map((it) => [it.description || "—", formatMoney(it.amount, data.currency)]),
    theme: "plain",
    styles: { fontSize: 10, cellPadding: { top: 8, bottom: 8, left: 0, right: 0 }, textColor: INK },
    headStyles: {
      fontStyle: "bold",
      textColor: MUTED,
      fontSize: 9,
      lineWidth: { bottom: 1 },
      lineColor: [230, 232, 235],
    },
    bodyStyles: { lineWidth: { bottom: 0.5 }, lineColor: [238, 240, 242] },
    columnStyles: { 1: { halign: "right" } },
  });

  // --- Totals ------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ty = ((doc as any).lastAutoTable?.finalY ?? y + 60) + 18;
  const labelX = right - 180;
  const drawTotal = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(...(bold ? INK : MUTED));
    doc.text(label, labelX, ty);
    doc.setTextColor(...INK);
    doc.text(value, right, ty, { align: "right" });
    ty += bold ? 22 : 18;
  };
  drawTotal("Subtotal", formatMoney(subtotal, data.currency));
  drawTotal(`Tax (${data.taxRate}%)`, formatMoney(tax, data.currency));
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(1.2);
  doc.line(labelX, ty - 6, right, ty - 6);
  drawTotal("Total Due", formatMoney(total, data.currency), true);

  // --- Notes + footer ----------------------------------------------------
  if (data.notes?.trim()) {
    ty += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("NOTES", margin, ty);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(data.notes.trim(), pageW - margin * 2), margin, ty + 14);
  }

  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `Thank you for your business.  ·  ${siteConfig.company.name}  ·  ${siteConfig.contact.email}`,
    pageW / 2,
    footerY,
    { align: "center" },
  );

  doc.save(`${data.number}.pdf`);
}
