import PDFDocument from "pdfkit";
import { formatDateDisplay, formatRs, formatQuantity } from "@/lib/format";
import type { InvoiceDraft, InvoiceTotals, SellerProfile } from "@/lib/types";

type PdfInvoiceInput = {
  seller: SellerProfile;
  draft: InvoiceDraft;
  totals: InvoiceTotals;
};

const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 34,
};

const COLORS = {
  ink: "#18181b",
  muted: "#52525b",
  line: "#d4d4d8",
  heavy: "#18181b",
  pale: "#f4f4f5",
};

function money(value: number) {
  return formatRs(value);
}

function textOrDash(value: string) {
  return value.trim() || "-";
}

function collectPdf(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function drawTextBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  body: string,
) {
  doc.rect(x, y, width, height).stroke(COLORS.line);
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(COLORS.muted)
    .text(title.toUpperCase(), x + 8, y + 7, { width: width - 16 });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(COLORS.ink)
    .text(body, x + 8, y + 22, {
      width: width - 16,
      height: height - 28,
      lineGap: 1.5,
    });
}

function drawMetaCell(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
) {
  const labelWidth = 92;
  doc.rect(x, y, width, 22).stroke(COLORS.line);
  doc.rect(x, y, labelWidth, 22).fillAndStroke(COLORS.pale, COLORS.line);
  doc
    .font("Helvetica-Bold")
    .fontSize(7.2)
    .fillColor(COLORS.muted)
    .text(label, x + 6, y + 7, { width: labelWidth - 10 });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.ink)
    .text(value || "-", x + labelWidth + 6, y + 7, {
      width: width - labelWidth - 12,
    });
}

function parseDataUrl(dataUrl: string): Buffer | null {
  const match = /^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/.exec(dataUrl);
  if (match) return Buffer.from(match[1], "base64");
  if (dataUrl.startsWith("/")) {
    try {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), "public", dataUrl.replace(/^\/+/, ""));
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
      }
    } catch {
      // ignore fallback failure
    }
  }
  return null;
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  seller: SellerProfile,
  draft: InvoiceDraft,
) {
  const x = PAGE.margin;
  const top = PAGE.margin;
  const contentWidth = PAGE.width - PAGE.margin * 2;
  const leftWidth = 304;
  const rightWidth = contentWidth - leftWidth;

  doc.rect(x, top, contentWidth, 28).fill(COLORS.heavy);
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#ffffff")
    .text("TAX INVOICE", x, top + 8, {
      width: contentWidth,
      align: "center",
      characterSpacing: 2,
    });

  const infoY = top + 28;
  doc.rect(x, infoY, leftWidth, 132).stroke(COLORS.line);

  const logo = seller.logoDataUrl ? parseDataUrl(seller.logoDataUrl) : null;
  if (logo) {
    try {
      doc.image(logo, x + 8, infoY + 12, { fit: [58, 58] });
    } catch {
      // Ignore invalid image data and continue rendering the invoice.
    }
  }

  const sellerTextX = x + (logo ? 76 : 12);
  const sellerTextWidth = leftWidth - (logo ? 86 : 24);

  const companyName = seller.companyName.toUpperCase();
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(COLORS.ink);
  const nameHeight = doc.heightOfString(companyName, { width: sellerTextWidth });
  doc.text(companyName, sellerTextX, infoY + 10, {
    width: sellerTextWidth,
  });

  const addressY = infoY + 10 + nameHeight + 4;
  doc
    .font("Helvetica")
    .fontSize(7.2)
    .fillColor(COLORS.muted)
    .text(seller.address, sellerTextX, addressY, {
      width: sellerTextWidth,
      lineGap: 1.1,
    });

  const panY = infoY + 84;
  const gstinY = infoY + 97;
  const stateY = infoY + 110;

  doc
    .font("Helvetica-Bold")
    .fontSize(7.6)
    .fillColor(COLORS.ink)
    .text(`PAN: ${seller.pan}`, sellerTextX, panY, {
      width: sellerTextWidth,
    })
    .text(`GSTIN/UIN: ${seller.gstin}`, sellerTextX, gstinY, {
      width: sellerTextWidth,
    });
  doc
    .font("Helvetica")
    .fontSize(7.4)
    .fillColor(COLORS.muted)
    .text(`State: ${seller.stateName}, Code: ${seller.stateCode}`, sellerTextX, stateY, {
      width: sellerTextWidth,
    });

  const metaX = x + leftWidth;
  const meta = [
    ["Invoice No.", draft.meta.invoiceNumber],
    ["Dated", formatDateDisplay(draft.meta.invoiceDate)],
    ["Payment", draft.meta.modeOfPayment],
    ["Order No.", draft.meta.buyersOrderNo],
    ["Dispatch Doc", draft.meta.dispatchDocNo],
    ["Through", draft.meta.dispatchedThrough],
  ];
  meta.forEach(([label, value], index) =>
    drawMetaCell(doc, metaX, infoY + index * 22, rightWidth, label, value),
  );

  return infoY + 132;
}

function drawPartySection(
  doc: PDFKit.PDFDocument,
  draft: InvoiceDraft,
  startY: number,
) {
  const x = PAGE.margin;
  const contentWidth = PAGE.width - PAGE.margin * 2;
  const half = contentWidth / 2;
  const buyerText = [
    textOrDash(draft.buyer.name),
    draft.buyer.address,
    draft.buyer.gstin ? `GSTIN/UIN: ${draft.buyer.gstin}` : "",
    draft.buyer.stateName
      ? `State: ${draft.buyer.stateName}${draft.buyer.stateCode ? `, Code: ${draft.buyer.stateCode}` : ""}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  drawTextBox(doc, x, startY, half, 96, "Buyer (Bill to)", buyerText);
  drawTextBox(
    doc,
    x + half,
    startY,
    half,
    96,
    "Delivery address",
    textOrDash(draft.meta.deliveryAddress),
  );
  return startY + 96;
}

function drawItems(
  doc: PDFKit.PDFDocument,
  totals: InvoiceTotals,
  startY: number,
) {
  const x = PAGE.margin;
  const widths = [20, 185, 50, 32, 72, 26, 32, 32, 78];
  const headers = ["Sl", "Description", "HSN/SAC", "Qty", "Rate", "per", "Disc.%", "GST%", "Amount"];
  const rowHeight = 28;
  let y = startY;

  doc.rect(x, y, PAGE.width - PAGE.margin * 2, 24).fill(COLORS.heavy);
  let cursor = x;
  headers.forEach((header, index) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(7.2)
      .fillColor("#ffffff")
      .text(header, cursor + 4, y + 8, {
        width: widths[index] - 8,
        align: index >= 3 && index !== 5 ? "right" : index === 5 ? "center" : "left",
      });
    cursor += widths[index];
  });
  y += 24;

  totals.lines.forEach((line, index) => {
    if (y + rowHeight > PAGE.height - 210) {
      doc.addPage();
      y = PAGE.margin;
    }
    if (index % 2 === 1) {
      doc
        .rect(x, y, PAGE.width - PAGE.margin * 2, rowHeight)
        .fillOpacity(0.18)
        .fill(COLORS.pale)
        .fillOpacity(1);
    }
    cursor = x;
    const cells = [
      String(line.slNo),
      line.description,
      line.hsnSac,
      String(line.quantity || ""),
      line.rate ? money(line.rate) : "",
      line.unit,
      line.discountPercent ? String(line.discountPercent) : "",
      line.gstRatePercent ? String(line.gstRatePercent) : "",
      line.amount ? money(line.amount) : "",
    ];
    widths.forEach((width, cellIndex) => {
      doc.rect(cursor, y, width, rowHeight).stroke(COLORS.line);
      doc
        .font(cellIndex === 1 ? "Helvetica" : "Helvetica")
        .fontSize(7.2)
        .fillColor(COLORS.ink)
        .text(cells[cellIndex], cursor + 4, y + 7, {
          width: width - 8,
          height: rowHeight - 10,
          align:
            cellIndex >= 3 && cellIndex !== 5
              ? "right"
              : cellIndex === 0 || cellIndex === 5
                ? "center"
                : "left",
      });
      cursor += width;
    });
    y += rowHeight;
  });

  const minRows = Math.max(0, 5 - totals.lines.length);
  for (let i = 0; i < minRows; i += 1) {
    cursor = x;
    widths.forEach((width) => {
      doc.rect(cursor, y, width, 22).stroke(COLORS.line);
      cursor += width;
    });
    y += 22;
  }

  const qstartX = x + 20 + 185 + 50; // x + 255
  const qwidth = 32;
  const astartX = x + 20 + 185 + 50 + 32 + 72 + 26 + 32 + 32; // x + 449
  const awidth = 78;

  doc.rect(x, y, PAGE.width - PAGE.margin * 2, 24).fillAndStroke(COLORS.pale, COLORS.line);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.ink)
    .text("Total", x + 8, y + 8, { width: 240, align: "right" })
    .text(money(totals.subtotal), astartX + 4, y + 8, { width: awidth - 8, align: "right" });
  doc.text(formatQuantity(totals.totalQuantity), qstartX + 2, y + 8, {
    width: qwidth - 4,
    align: "right",
  });

  return y + 24;
}

function drawTotals(doc: PDFKit.PDFDocument, totals: InvoiceTotals, y: number) {
  const x = PAGE.margin;
  const contentWidth = PAGE.width - PAGE.margin * 2;
  const leftWidth = 300;
  const rightX = x + leftWidth;
  const rightWidth = contentWidth - leftWidth;
  const taxLines =
    totals.taxBreakup.length > 0
      ? totals.taxBreakup.flatMap((row) =>
          row.igstRate > 0
            ? [[`Output IGST @ ${row.igstRate}%`, row.igstAmount]]
            : [
                [`Output CGST @ ${row.cgstRate}%`, row.cgstAmount],
                [`Output SGST @ ${row.sgstRate}%`, row.sgstAmount],
              ],
        )
      : [];
  const totalRows = [
    ...taxLines,
    ["Round Off", totals.roundOff],
    ["Grand Total", totals.grandTotal],
  ] as Array<[string, number]>;
  const totalHeight = totalRows.length * 22;

  drawTextBox(
    doc,
    x,
    y,
    leftWidth,
    totalHeight,
    "Amount chargeable (in words)",
    `In Indian Rupees - ${totals.amountInWords}`,
  );

  totalRows.forEach(([label, value], index) => {
    const rowY = y + index * 22;
    const isGrand = label === "Grand Total";
    doc
      .rect(rightX, rowY, rightWidth, 22)
      .fillAndStroke(isGrand ? COLORS.heavy : "#ffffff", COLORS.line);
    doc
      .font(isGrand ? "Helvetica-Bold" : "Helvetica")
      .fontSize(isGrand ? 9 : 8)
      .fillColor(isGrand ? "#ffffff" : COLORS.ink)
      .text(label, rightX + 8, rowY + 7, { width: 100 })
      .text(money(value), rightX + 118, rowY + 7, {
        width: rightWidth - 126,
        align: "right",
      });
  });

  return y + totalHeight;
}

function drawFooter(
  doc: PDFKit.PDFDocument,
  seller: SellerProfile,
  y: number,
) {
  const x = PAGE.margin;
  const contentWidth = PAGE.width - PAGE.margin * 2;
  const half = contentWidth / 2;
  const footerHeight = 112;

  drawTextBox(
    doc,
    x,
    y,
    half,
    footerHeight,
    "Company's bank details",
    [
      `Bank Name: ${seller.bankName}`,
      `A/C No: ${seller.bankAccountNo}`,
      `IFSC Code: ${seller.bankIfsc}`,
      `Branch: ${seller.bankBranch}`,
    ].join("\n"),
  );
  drawTextBox(doc, x + half, y, half, footerHeight, "Declaration", seller.declaration);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.ink)
    .text(`for ${seller.companyName}`, x + half + 120, y + 62, {
      width: half - 132,
      align: "right",
    });
  doc
    .moveTo(x + half + 120, y + 92)
    .lineTo(x + contentWidth - 12, y + 92)
    .stroke(COLORS.line);
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.muted)
    .text("Authorised Signatory", x + half + 120, y + 96, {
      width: half - 132,
      align: "right",
    });
}

export async function renderInvoicePdf(input: PdfInvoiceInput): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    bufferPages: true,
    info: {
      Title: `Tax Invoice ${input.draft.meta.invoiceNumber}`,
      Author: input.seller.companyName,
      Subject: "GST Tax Invoice",
    },
  });
  doc.on("pageAdded", () => {
    console.log("PAGE ADDED TRIGGERED!");
  });
  const done = collectPdf(doc);

  let y = drawHeader(doc, input.seller, input.draft);
  y = drawPartySection(doc, input.draft, y);
  y = drawItems(doc, input.totals, y);
  y = drawTotals(doc, input.totals, y);
  drawFooter(doc, input.seller, y);

  doc.end();
  return done;
}
