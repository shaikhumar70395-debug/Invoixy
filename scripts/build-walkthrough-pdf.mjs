import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

function buildPdf(mdPath, pdfPath, mainTitle, docType) {
  const content = fs.readFileSync(mdPath, "utf8");
  const lines = content.split("\n");

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 45, bottom: 45, left: 45, right: 45 },
    bufferPages: true,
  });

  const writeStream = fs.createWriteStream(pdfPath);
  doc.pipe(writeStream);

  // Cover / Header Banner
  doc.rect(45, 45, 505.28, 65).fill("#1e1b4b");
  doc.font("Helvetica-Bold").fontSize(18).fillColor("#ffffff").text(mainTitle, 60, 60, { width: 475 });
  doc.font("Helvetica").fontSize(9.5).fillColor("#a5b4fc").text(docType + " | Invoixy GST SaaS Platform", 60, 85, { width: 475 });
  doc.y = 125;

  let inCodeBlock = false;
  let codeBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();

    // Check page break safety
    if (doc.y > 740) {
      doc.addPage();
    }

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        const codeText = codeBuffer.join("\n");
        doc.font("Courier").fontSize(7).fillColor("#1e293b");
        const boxHeight = Math.min(doc.heightOfString(codeText, { width: 485 }) + 14, 250);
        if (doc.y + boxHeight > 750) doc.addPage();
        doc.rect(45, doc.y, 505.28, boxHeight).fillAndStroke("#f8fafc", "#cbd5e1");
        doc.fillColor("#0f172a").text(codeText, 55, doc.y + 6, { width: 485 });
        doc.y += 10;
        codeBuffer = [];
      } else {
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Skip horizontal rules
    if (line.startsWith("---") || line.startsWith("===")) {
      doc.moveDown(0.4);
      doc.moveTo(45, doc.y).lineTo(550.28, doc.y).strokeColor("#e2e8f0").stroke();
      doc.moveDown(0.4);
      continue;
    }

    // Headers
    if (line.startsWith("# ")) {
      continue;
    } else if (line.startsWith("## ")) {
      if (doc.y > 670) doc.addPage();
      doc.moveDown(0.8);
      const text = line.replace(/^##\s+/, "");
      doc.rect(45, doc.y, 4, 18).fill("#4318ff");
      doc.font("Helvetica-Bold").fontSize(13).fillColor("#0f172a").text(text, 55, doc.y + 2);
      doc.moveDown(0.4);
    } else if (line.startsWith("### ")) {
      if (doc.y > 710) doc.addPage();
      doc.moveDown(0.5);
      const text = line.replace(/^###\s+/, "");
      doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#1e293b").text(text);
      doc.moveDown(0.2);
    } else if (line.startsWith("> ")) {
      const quoteText = line.replace(/^>\s+/, "").replace(/\*\*/g, "");
      doc.rect(45, doc.y, 3, 14).fill("#6366f1");
      doc.font("Helvetica-Oblique").fontSize(8.5).fillColor("#475569").text(quoteText, 55, doc.y + 1, { width: 490 });
      doc.moveDown(0.2);
    } else if (line.startsWith("* ") || line.startsWith("- ")) {
      const bulletText = line.replace(/^[\*\-]\s+/, "").replace(/\*\*/g, "");
      doc.font("Helvetica").fontSize(8.5).fillColor("#334155").text("•  " + bulletText, 55, doc.y, { width: 490, lineGap: 1.5 });
      doc.moveDown(0.2);
    } else if (/^\d+\.\s+/.test(line)) {
      const numText = line.replace(/\*\*/g, "");
      doc.font("Helvetica").fontSize(8.5).fillColor("#334155").text(numText, 55, doc.y, { width: 490, lineGap: 1.5 });
      doc.moveDown(0.2);
    } else if (line.startsWith("|")) {
      if (doc.y > 730) doc.addPage();
      const cleanRow = line.replace(/\*\*/g, "").replace(/\\/g, "");
      doc.font("Courier").fontSize(7).fillColor("#1e293b").text(cleanRow, 45, doc.y, { width: 505 });
    } else if (line.trim().length > 0) {
      const cleanText = line.replace(/\*\*/g, "").replace(/`/g, "");
      doc.font("Helvetica").fontSize(8.8).fillColor("#334155").text(cleanText, 45, doc.y, { width: 505, lineGap: 2 });
      doc.moveDown(0.3);
    } else {
      doc.moveDown(0.2);
    }
  }

  // Footer page numbering
  const pageRange = doc.bufferedPageRange();
  for (let i = 0; i < pageRange.count; i++) {
    doc.switchToPage(i);
    doc.font("Helvetica").fontSize(7.5).fillColor("#94a3b8");
    doc.text(
      "Invoixy Walkthrough — Page " + (i + 1) + " of " + pageRange.count + "  •  Apex Electronics & Appliances",
      45,
      800,
      { align: "center", width: 505.28 }
    );
  }

  doc.end();

  return new Promise((resolve) => {
    writeStream.on("finish", () => {
      const stats = fs.statSync(pdfPath);
      console.log("Generated:", pdfPath, "Pages:", pageRange.count, "Size:", stats.size, "bytes");
      fs.copyFileSync(pdfPath, path.join("public", path.basename(pdfPath)));
      console.log("Copied to public folder successfully!");
      resolve();
    });
    writeStream.on("error", (err) => {
      console.error("Write error:", err);
    });
  });
}

async function run() {
  await buildPdf(
    path.join(process.cwd(), "INVOIXY_APPLICATION_WALKTHROUGH.md"),
    path.join(process.cwd(), "INVOIXY_APPLICATION_WALKTHROUGH.pdf"),
    "Invoixy — Application Walkthrough & Features",
    "Comprehensive Section-by-Section Feature Reference"
  );
}

run();
