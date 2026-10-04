import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

async function createInteractivePdf() {
  const pdfPath = path.join(process.cwd(), "INVOIXY_INTERACTIVE_PRESENTATION.pdf");
  const publicPdfPath = path.join(process.cwd(), "public", "INVOIXY_INTERACTIVE_PRESENTATION.pdf");

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 45, left: 45, right: 45 },
    bufferPages: true,
  });

  const writeStream = fs.createWriteStream(pdfPath);
  doc.pipe(writeStream);

  const outline = doc.outline;
  const hubOutline = outline.addItem("01. Interactive Navigation Hub");
  const scriptOutline = outline.addItem("02. Spoken Presentation Walkthrough");
  const gstOutline = outline.addItem("03. GST Engine Mathematical Formulation");
  const techOutline = outline.addItem("04. Technical Architecture & Schema");
  const vivaOutline = outline.addItem("05. Top 10 Viva Defense Q&A");

  // Helper: Draw standard top interactive nav bar
  function drawNavBar() {
    doc.rect(45, 15, 505.28, 22).fillAndStroke("#f1f5f9", "#cbd5e1");
    doc.font("Helvetica-Bold").fontSize(7.5);

    // Links
    doc.fillColor("#4318ff").text("🏠 Navigation Hub", 55, 22, { goTo: "hub", underline: true });
    doc.fillColor("#059669").text("🌐 Live Web App", 155, 22, { link: "https://invoixy.vercel.app", underline: true });
    doc.fillColor("#0284c7").text("⚡ New Invoice Demo", 240, 22, { link: "https://invoixy.vercel.app/invoices/new", underline: true });
    doc.fillColor("#7c3aed").text("🛠️ Technical Schema", 350, 22, { goTo: "schema", underline: true });
    doc.fillColor("#dc2626").text("🎯 Viva Q&A", 460, 22, { goTo: "viva", underline: true });
  }

  // Helper: Speech Box
  function drawSpeechBox(title, text) {
    const boxY = doc.y;
    const textHeight = doc.heightOfString(text, { width: 475, lineGap: 1.5 });
    doc.rect(45, boxY, 505.28, textHeight + 28).fillAndStroke("#f8fafc", "#cbd5e1");
    doc.rect(45, boxY, 505.28, 18).fill("#1e1b4b");
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#ffffff").text("🎙️ " + title.toUpperCase(), 55, boxY + 5);
    doc.font("Helvetica").fontSize(8.8).fillColor("#1e293b").text(text, 55, boxY + 24, { width: 485, lineGap: 1.5 });
    doc.y = boxY + textHeight + 36;
  }

  // Helper: Action Box
  function drawActionBox(actionTitle, actionText, actionLink) {
    const boxY = doc.y;
    const textHeight = doc.heightOfString(actionText, { width: 475, lineGap: 1.5 });
    doc.rect(45, boxY, 505.28, textHeight + 32).fillAndStroke("#f0fdf4", "#86efac");
    doc.rect(45, boxY, 505.28, 18).fill("#065f46");
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#ffffff").text("🖱️ ON-SCREEN ACTION: " + actionTitle.toUpperCase(), 55, boxY + 5);
    doc.font("Helvetica").fontSize(8.8).fillColor("#064e3b").text(actionText, 55, boxY + 24, { width: 485, lineGap: 1.5 });
    if (actionLink) {
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#047857").text("👉 Click here to test live: " + actionLink, 55, boxY + textHeight + 22, { link: actionLink, underline: true });
    }
    doc.y = boxY + textHeight + 40;
  }

  // ==========================================
  // PAGE 1: INTERACTIVE NAVIGATION HUB & COVER
  // ==========================================
  doc.addNamedDestination("hub");
  drawNavBar();

  doc.rect(45, 45, 505.28, 90).fill("#1e1b4b");
  doc.font("Helvetica-Bold").fontSize(20).fillColor("#ffffff").text("Invoixy — Interactive Presentation Guide", 60, 62);
  doc.font("Helvetica").fontSize(10).fillColor("#a5b4fc").text("Live Demonstration Script • Architectural Specs • Examiner Viva Defense", 60, 90);
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#38bdf8").text("🌐 Production URL: https://invoixy.vercel.app  (Click to Open)", 60, 110, { link: "https://invoixy.vercel.app", underline: true });

  doc.y = 150;
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#0f172a").text("Interactive Table of Contents & Quick Jump Links");
  doc.font("Helvetica").fontSize(8.5).fillColor("#64748b").text("Click any section below to jump directly to that page inside this document:");
  doc.moveDown(0.6);

  const hubItems = [
    { title: "1. Spoken Presentation Script (Step-by-Step)", dest: "script", desc: "Word-for-word spoken lines and on-screen actions for your live demo." },
    { title: "2. The Core Showcase: 30-Second Invoicing", dest: "showcase", desc: "Walkthrough of customer presets, product catalog, and live A4 preview." },
    { title: "3. Indian GST Engine & Rule 46 Compliance", dest: "gst-math", desc: "Formulas for Intra-state (CGST+SGST) vs. Inter-state (IGST) & round-off." },
    { title: "4. Full-Stack System Architecture & Database Schema", dest: "schema", desc: "Next.js 16, Turso Edge Cloud, Prisma 10-model relational schema." },
    { title: "5. Top 10 Viva / Examiner Defense Questions & Answers", dest: "viva", desc: "Direct answers to the most common questions professors and examiners ask." },
  ];

  hubItems.forEach((item, index) => {
    const cardY = doc.y;
    doc.rect(45, cardY, 505.28, 40).fillAndStroke("#f8fafc", "#cbd5e1");
    doc.rect(45, cardY, 6, 40).fill("#4318ff");
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e1b4b").text(item.title, 60, cardY + 8, { goTo: item.dest, underline: true });
    doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(item.desc, 60, cardY + 23);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#4318ff").text("JUMP ➔", 490, cardY + 14, { goTo: item.dest, underline: true });
    doc.y = cardY + 46;
  });

  doc.moveDown(0.5);
  doc.rect(45, doc.y, 505.28, 60).fillAndStroke("#eff6ff", "#bfdbfe");
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#1e40af").text("💡 PRESENTER PRO-TIP FOR TOMORROW MORNING:", 55, doc.y + 8);
  doc.font("Helvetica").fontSize(8.2).fillColor("#1e3a8a").text(
    "Open the live app at https://invoixy.vercel.app in one browser tab, and keep this interactive PDF open side-by-side. You can click the links inside this PDF to trigger the exact pages during your demonstration!",
    55, doc.y + 24, { width: 485, lineGap: 1.5 }
  );

  // ==========================================
  // PAGE 2: SPOKEN PRESENTATION WALKTHROUGH
  // ==========================================
  doc.addPage();
  doc.addNamedDestination("script");
  drawNavBar();

  doc.y = 48;
  doc.font("Helvetica-Bold").fontSize(15).fillColor("#0f172a").text("Step-by-Step Presentation Walkthrough");
  doc.font("Helvetica").fontSize(8.5).fillColor("#64748b").text("Read the speech boxes aloud while executing the action boxes on screen.");
  doc.moveDown(0.6);

  drawSpeechBox(
    "Step 1: Introduction & The 3 Billing Headaches (30 Seconds)",
    "Respected professors and evaluators, today I am presenting Invoixy, a modern cloud-based GST Invoicing platform designed for retail and wholesale businesses. In traditional retail, shopkeepers face three major problems: manual math errors calculating taxes, long customer wait lines, and strict Rule 46 GST compliance. Invoixy automates the entire process, generating compliant bills in under 30 seconds."
  );

  drawActionBox(
    "Open Login Screen & Mount Demo Sandbox",
    "Point to the login options (Google OAuth and Email). Then click 'Want to test first? Sign in as Demo →' to instantly mount the multi-device demo store.",
    "https://invoixy.vercel.app/login"
  );

  drawSpeechBox(
    "Step 2: Business Context — Apex Electronics & Appliances",
    "To demonstrate real-world commercial viability, we configured Invoixy for Apex Electronics & Appliances in Kurla West, Mumbai. Electronics retail is the ideal showcase because items span multiple GST slabs—from 18% on laptops and TVs to 28% on air conditioners—with mandatory HSN codes for manufacturer warranty claims."
  );

  drawActionBox(
    "Show Store Dashboard & Revenue Metrics",
    "Highlight the summary metric cards: Total Revenue, Paid Invoices count, Pending Bills, and the Recent Invoices ledger.",
    "https://invoixy.vercel.app/"
  );

  // ==========================================
  // PAGE 3: 30-SECOND BILLING SHOWCASE
  // ==========================================
  doc.addPage();
  doc.addNamedDestination("showcase");
  drawNavBar();

  doc.y = 48;
  doc.font("Helvetica-Bold").fontSize(15).fillColor("#0f172a").text("The Core Showcase: Creating an Invoice in 30s");
  doc.moveDown(0.6);

  drawActionBox(
    "Navigate to New Invoice Workspace",
    "Click 'New Invoice' in the top navbar. Point out the split layout: Data Entry Form on the left and Live Interactive A4 Preview on the right.",
    "https://invoixy.vercel.app/invoices/new"
  );

  drawSpeechBox(
    "Step 3: Explaining 1-Click Customer & Product Presets",
    "Watch how fast billing is. Instead of typing addresses and tax numbers manually, I select 'Rahul Sharma' from Saved Customers. His Mumbai address, GSTIN, and Maharashtra state code (27) auto-fill instantly. Next, I pick 'Sony Bravia 55-inch 4K TV' from Saved Products. The description, HSN code 8528, unit, and 18% tax rate load in one click."
  );

  drawSpeechBox(
    "Step 4: The Live GST Calculation & Interactive A4 Preview",
    "Behind the scenes, Invoixy compares our seller state code (27) with the buyer's state code (27). Because they match, it automatically classifies this as Intra-State and divides the 18% tax into 9% CGST and 9% SGST. The nearest-rupee round-off is calculated automatically. On the right, the live A4 preview reflects every change instantly."
  );

  drawActionBox(
    "Print Server-Side Vector PDF",
    "Click the 'Print / PDF' button. Show the official Tax Invoice featuring the high-res Apex logo, itemized table, bank remittance details, and total in Indian words.",
    "https://invoixy.vercel.app/invoices/new"
  );

  // ==========================================
  // PAGE 4: GST ENGINE MATH & FORMULAS
  // ==========================================
  doc.addPage();
  doc.addNamedDestination("gst-math");
  drawNavBar();

  doc.y = 48;
  doc.font("Helvetica-Bold").fontSize(15).fillColor("#0f172a").text("Indian GST Engine Mathematical Formulation");
  doc.font("Helvetica").fontSize(8.5).fillColor("#64748b").text("Mathematical logic implemented in src/lib/gst.ts following CGST Rule 46.");
  doc.moveDown(0.6);

  const formulas = [
    { title: "1. Taxable Amount Calculation", eq: "TaxableAmount = Quantity * Rate * (1 - (DiscountPercent / 100))" },
    { title: "2. Intra-State Tax Split (Seller Code == Buyer Code == 27)", eq: "CGSTRate = GSTRate / 2  |  SGSTRate = GSTRate / 2  |  IGSTRate = 0\nCGSTAmount = TaxableAmount * (CGSTRate / 100)\nSGSTAmount = TaxableAmount * (SGSTRate / 100)" },
    { title: "3. Inter-State Tax Logic (Seller Code != Buyer Code)", eq: "IGSTRate = GSTRate  |  CGSTRate = 0  |  SGSTRate = 0\nIGSTAmount = TaxableAmount * (IGSTRate / 100)" },
    { title: "4. Nearest-Rupee Round-Off Formulation", eq: "UnroundedTotal = Subtotal + TotalTax\nGrandTotal = Math.round(UnroundedTotal)\nRoundOff = GrandTotal - UnroundedTotal" },
    { title: "5. Indian Number-to-Words Algorithm", eq: "Converts totals into formal Indian currency words (Lakhs and Crores):\nExample: Rs. 2,35,888 -> 'INR Two Lakh Thirty-Five Thousand Eight Hundred Eighty-Eight Only'" }
  ];

  formulas.forEach((item) => {
    const fY = doc.y;
    doc.rect(45, fY, 505.28, 44).fillAndStroke("#f8fafc", "#cbd5e1");
    doc.rect(45, fY, 4, 44).fill("#0284c7");
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a").text(item.title, 55, fY + 6);
    doc.font("Courier").fontSize(7.5).fillColor("#0369a1").text(item.eq, 55, fY + 20, { lineGap: 1.5 });
    doc.y = fY + 50;
  });

  // ==========================================
  // PAGE 5: TECHNICAL ARCHITECTURE & SCHEMA
  // ==========================================
  doc.addPage();
  doc.addNamedDestination("schema");
  drawNavBar();

  doc.y = 48;
  doc.font("Helvetica-Bold").fontSize(15).fillColor("#0f172a").text("Full-Stack Architecture & 10-Model Schema");
  doc.font("Helvetica").fontSize(8.5).fillColor("#64748b").text("Next.js 16 Serverless + Prisma ORM + Turso Cloud Database (AWS ap-south-1).");
  doc.moveDown(0.6);

  const models = [
    { name: "User", purpose: "Authentication identity (Google OAuth, name, email, avatar)." },
    { name: "Shop", purpose: "Multi-tenant business container (Apex Electronics, Demo Shop)." },
    { name: "ShopMember", purpose: "RBAC junction table linking User to Shop with roles (OWNER, MEMBER)." },
    { name: "SellerSettings", purpose: "Business identity: GSTIN, PAN, address, bank IFSC, and logo base64." },
    { name: "Customer", purpose: "Preset buyer address book with state code mapping." },
    { name: "Product", purpose: "Inventory catalog with HSN/SAC codes, rates, and default tax slabs." },
    { name: "Invoice", purpose: "Immutable snapshot of issued bill with sequence and payment status." },
    { name: "InvoiceLine", purpose: "Individual item breakdown with quantity, unit rate, and tax values." },
    { name: "InvoiceSequence", purpose: "Atomic sequence counter preventing invoice number collisions." },
    { name: "SecuritySettings", purpose: "Terminal inactivity timer and counter lock credentials." }
  ];

  models.forEach((m, idx) => {
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#1e1b4b").text((idx + 1) + ". " + m.name + ": ", 50, doc.y, { continued: true });
    doc.font("Helvetica").fontSize(8.2).fillColor("#334155").text(m.purpose);
    doc.moveDown(0.25);
  });

  doc.moveDown(0.5);
  doc.rect(45, doc.y, 505.28, 48).fillAndStroke("#faf5ff", "#e9d5ff");
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#6b21a8").text("🔒 MULTI-TENANCY ISOLATION GUARANTEE:", 55, doc.y + 6);
  doc.font("Helvetica").fontSize(8).fillColor("#581c87").text(
    "Every query for customers, products, and invoices is filtered strictly by 'where: { shopId: session.activeShopId }'. User A can never access User B's billing records. The demo sandbox operates in its own dedicated, isolated shop container.",
    55, doc.y + 20, { width: 485, lineGap: 1.5 }
  );

  // ==========================================
  // PAGE 6: TOP 10 VIVA DEFENSE Q&A
  // ==========================================
  doc.addPage();
  doc.addNamedDestination("viva");
  drawNavBar();

  doc.y = 48;
  doc.font("Helvetica-Bold").fontSize(15).fillColor("#0f172a").text("Top 10 Viva & Examiner Defense Questions");
  doc.font("Helvetica").fontSize(8.5).fillColor("#64748b").text("Memorize or refer to these high-scoring technical answers during your viva.");
  doc.moveDown(0.6);

  const vivaQuestions = [
    { q: "Q1. What is the architecture of Invoixy?", a: "Full-Stack Serverless Architecture on Next.js 16 with React Server Components (RSC) and Server Actions connected to a Turso distributed edge database." },
    { q: "Q2. Why did you use Turso (LibSQL) instead of MySQL or MongoDB?", a: "Turso is a serverless, distributed SQLite edge database hosted in AWS Mumbai. It offers sub-20ms query latency, zero server maintenance, and native atomic transactions." },
    { q: "Q3. How do you prevent duplicate invoice numbers?", a: "We maintain an InvoiceSequence table inside an atomic database transaction (prisma.$transaction). The counter is incremented with an atomic lock per financial year." },
    { q: "Q4. How is multi-tenancy enforced?", a: "Every record has a mandatory shopId foreign key. All queries filter strictly by activeShopId resolved from the cryptographically signed JWT session cookie." },
    { q: "Q5. Why server-side PDFKit instead of window.print()?", a: "Browser printing depends on printer drivers, page margins, and zoom levels, which break invoice formatting. PDFKit generates vector-crisp, identical A4 documents on every device." }
  ];

  vivaQuestions.forEach((item) => {
    const vY = doc.y;
    doc.rect(45, vY, 505.28, 48).fillAndStroke("#f8fafc", "#e2e8f0");
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#0f172a").text(item.q, 55, vY + 6);
    doc.font("Helvetica").fontSize(8).fillColor("#334155").text(item.a, 55, vY + 20, { width: 485, lineGap: 1.5 });
    doc.y = vY + 54;
  });

  // Footer page numbering across all pages
  const pageRange = doc.bufferedPageRange();
  for (let i = 0; i < pageRange.count; i++) {
    doc.switchToPage(i);
    doc.font("Helvetica").fontSize(7.5).fillColor("#94a3b8");
    doc.text(
      "Invoixy Interactive Guide — Page " + (i + 1) + " of " + pageRange.count + "  •  Click headers to jump between sections",
      45,
      805,
      { align: "center", width: 505.28 }
    );
  }

  doc.end();

  return new Promise((resolve) => {
    writeStream.on("finish", () => {
      const stats = fs.statSync(pdfPath);
      console.log("Generated:", pdfPath, "Pages:", pageRange.count, "Size:", stats.size, "bytes");
      fs.copyFileSync(pdfPath, publicPdfPath);
      console.log("Copied to public folder successfully!");
      resolve();
    });
  });
}

createInteractivePdf().catch((err) => {
  console.error("Failed to build interactive PDF:", err);
  process.exit(1);
});
