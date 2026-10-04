import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const tursoUrl = process.env.DATABASE_URL;
const tursoToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

const localClient = createClient({ url: "file:./dev.db" });
const cloudClient = (tursoUrl && tursoUrl.startsWith("libsql://") && tursoToken)
  ? createClient({ url: tursoUrl, authToken: tursoToken })
  : null;

// Amount in words
const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

function twoDigits(n) {
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${tens[t]} ${ones[o]}` : tens[t];
}

function threeDigits(n) {
  if (n === 0) return "";
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const hundred = h ? `${ones[h]} HUNDRED` : "";
  const tail = rest ? twoDigits(rest) : "";
  if (hundred && tail) return `${hundred} ${tail}`;
  return hundred || tail;
}

function section(n, label) {
  if (n === 0) return "";
  return `${threeDigits(n)} ${label}`.trim();
}

function amountInWords(amount) {
  const rupees = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - rupees) * 100);
  if (rupees === 0 && paise === 0) return "ZERO RUPEES ONLY";
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundredPart = rupees % 1000;
  const parts = [
    section(crore, "CRORE"),
    section(lakh, "LAKH"),
    section(thousand, "THOUSAND"),
    threeDigits(hundredPart),
  ].filter(Boolean);
  let words = parts.join(" ").replace(/\s+/g, " ").trim();
  words = words ? `${words} RUPEES` : "";
  if (paise > 0) {
    const paiseWords = `${twoDigits(paise)} PAISE`;
    words = words ? `${words} AND ${paiseWords}` : paiseWords;
  }
  return `${words} ONLY`.replace(/\s+/g, " ").trim();
}

function roundMoney(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function calculateInvoice(inv) {
  let subtotal = 0;
  let totalQuantity = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;

  const computedLines = inv.lines.map((line, idx) => {
    const qty = line.quantity;
    const rate = line.rate;
    const disc = line.discountPercent || 0;
    const amount = roundMoney(qty * rate * (1 - disc / 100));
    const gstRate = line.gstRatePercent || 18;
    const halfRate = gstRate / 2;
    const cgstAmount = roundMoney((amount * halfRate) / 100);
    const sgstAmount = roundMoney((amount * halfRate) / 100);

    subtotal = roundMoney(subtotal + amount);
    totalQuantity += qty;
    cgstTotal = roundMoney(cgstTotal + cgstAmount);
    sgstTotal = roundMoney(sgstTotal + sgstAmount);

    return {
      ...line,
      lineOrder: idx + 1,
      amount,
      cgstAmount,
      sgstAmount,
      igstAmount: 0,
      gstRatePercent: gstRate,
    };
  });

  const rawTotal = roundMoney(subtotal + cgstTotal + sgstTotal);
  const grandTotal = Math.round(rawTotal);
  const roundOff = roundMoney(grandTotal - rawTotal);
  const words = amountInWords(grandTotal);

  return {
    ...inv,
    lines: computedLines,
    totalQuantity,
    subtotal,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 0,
    cgstAmount: cgstTotal,
    sgstAmount: sgstTotal,
    igstAmount: 0,
    roundOff,
    grandTotal,
    amountInWords: words,
  };
}

const rawInvoice6 = {
  sequenceNumber: 6,
  financialYear: "26-27",
  invoiceDate: "2026-10-04",
  dueDate: "2026-10-24",
  modeOfPayment: "UPI",
  buyersOrderNo: "ORD-98449",
  dispatchDocNo: "DISP-06",
  deliveryNoteDate: "2026-10-04",
  dispatchedThrough: "In-Store Pickup",
  destination: "Mumbai",
  deliveryAddress: "Flat 701, Tower B, Oberoi Woods, Mohan Gokhale Road, Goregaon East, Mumbai, Maharashtra 400063",
  buyerName: "Vikramaditya Rathore",
  buyerAddress: "Flat 701, Tower B, Oberoi Woods, Mohan Gokhale Road, Goregaon East, Mumbai, Maharashtra 400063",
  buyerGstin: "27ACZPR1948H1ZF",
  buyerStateName: "MAHARASHTRA",
  buyerStateCode: "27",
  taxMode: "intra",
  gstRatePercent: 18,
  roundOffEnabled: true,
  paymentStatus: "paid",
  paidAmount: null,
  paymentDate: "2026-10-04",
  paymentMethod: "UPI",
  paymentNotes: "Paid via PhonePe ref #982144",
  lines: [
    {
      description: "Apple iPhone 15 (128GB, Black)",
      hsnSac: "85171300",
      quantity: 1,
      rate: 69999,
      unit: "Nos",
      discountPercent: 0,
      gstRatePercent: 18,
    },
    {
      description: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
      hsnSac: "85183000",
      quantity: 1,
      rate: 26990,
      unit: "Nos",
      discountPercent: 5,
      gstRatePercent: 18,
    },
  ],
};

async function addInvoiceToShop(client, shop, prefix) {
  const invNumber = `${prefix}/26-27/6`;

  // Check if invoice 6 already exists
  const existing = await client.execute({
    sql: "SELECT id FROM Invoice WHERE invoiceNumber = ?;",
    args: [invNumber],
  });

  if (existing.rows.length > 0) {
    console.log(`Invoice ${invNumber} already exists. Skipping.`);
    return;
  }

  const computedInv = calculateInvoice({
    ...rawInvoice6,
    invoiceNumber: invNumber,
  });

  const paidAmount = computedInv.paidAmount === null ? computedInv.grandTotal : computedInv.paidAmount;

  const insertRes = await client.execute({
    sql: `INSERT INTO Invoice (
      invoiceNumber, financialYear, sequenceNumber, invoiceDate, modeOfPayment,
      buyersOrderNo, dispatchDocNo, deliveryNoteDate, dispatchedThrough, destination,
      deliveryAddress, dueDate, buyerName, buyerAddress, buyerGstin, buyerStateName,
      buyerStateCode, taxMode, gstRatePercent, roundOffEnabled, totalQuantity, subtotal,
      cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount, roundOff,
      grandTotal, amountInWords, paymentStatus, paidAmount, paymentDate, paymentMethod,
      paymentNotes, shopId, createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
    );`,
    args: [
      computedInv.invoiceNumber, computedInv.financialYear, computedInv.sequenceNumber, computedInv.invoiceDate,
      computedInv.modeOfPayment, computedInv.buyersOrderNo, computedInv.dispatchDocNo, computedInv.deliveryNoteDate,
      computedInv.dispatchedThrough, computedInv.destination, computedInv.deliveryAddress, computedInv.dueDate,
      computedInv.buyerName, computedInv.buyerAddress, computedInv.buyerGstin, computedInv.buyerStateName,
      computedInv.buyerStateCode, computedInv.taxMode, computedInv.gstRatePercent, computedInv.roundOffEnabled ? 1 : 0,
      computedInv.totalQuantity, computedInv.subtotal, computedInv.cgstRate, computedInv.sgstRate, computedInv.igstRate,
      computedInv.cgstAmount, computedInv.sgstAmount, computedInv.igstAmount, computedInv.roundOff,
      computedInv.grandTotal, computedInv.amountInWords, computedInv.paymentStatus, paidAmount,
      computedInv.paymentDate, computedInv.paymentMethod, computedInv.paymentNotes, shop.id,
    ],
  });

  const invoiceId = Number(insertRes.lastInsertRowid);

  for (const line of computedInv.lines) {
    await client.execute({
      sql: `INSERT INTO InvoiceLine (
        invoiceId, lineOrder, description, hsnSac, quantity, rate, unit,
        discountPercent, gstRatePercent, cgstAmount, sgstAmount, igstAmount, amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        invoiceId, line.lineOrder, line.description, line.hsnSac, line.quantity,
        line.rate, line.unit, line.discountPercent, line.gstRatePercent,
        line.cgstAmount, line.sgstAmount, line.igstAmount, line.amount,
      ],
    });
  }

  // Update sequence
  await client.execute({
    sql: `INSERT OR REPLACE INTO InvoiceSequence (financialYear, lastNumber, shopId, createdAt, updatedAt)
          VALUES (?, ?, ?, datetime('now'), datetime('now'));`,
    args: ["26-27", 6, shop.id],
  });

  console.log(`  ✓ Created ${computedInv.invoiceNumber} for "${shop.name}" (${shop.id}) | ₹${computedInv.grandTotal.toLocaleString("en-IN")}`);
}

async function runForDb(client, label) {
  console.log(`\n========================================`);
  console.log(`Adding Invoice #6 in: ${label}`);
  console.log(`========================================`);

  // 1. Find live shop (not demo)
  const liveShop = (await client.execute("SELECT id, name FROM Shop WHERE slug != 'invoixy-demo-store' ORDER BY createdAt ASC LIMIT 1;")).rows[0];
  // 2. Find demo shop
  const demoShop = (await client.execute("SELECT id, name FROM Shop WHERE slug = 'invoixy-demo-store' LIMIT 1;")).rows[0];

  if (liveShop) {
    await addInvoiceToShop(client, liveShop, "APEX");
  } else {
    console.log("Live shop not found!");
  }

  if (demoShop) {
    await addInvoiceToShop(client, demoShop, "DEMO");
  } else {
    console.log("Demo shop not found!");
  }
}

async function run() {
  try {
    await runForDb(localClient, "Local SQLite (dev.db)");
    if (cloudClient) {
      await runForDb(cloudClient, "Turso Cloud DB");
    } else {
      console.log("Turso Cloud credentials not configured.");
    }
    console.log("\n🎉 INVOICE #6 CREATED FOR BOTH LIVE AND DEMO STORES!");
  } catch (err) {
    console.error("Error creating invoice #6:", err);
  }
}

run();
