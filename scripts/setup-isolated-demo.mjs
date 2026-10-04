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

const sampleCustomers = [
  {
    name: "Rahul Sharma",
    address: "Flat 402, Building 3, Greenfield Heights, Andheri West, Mumbai, Maharashtra 400053",
    stateName: "MAHARASHTRA",
    stateCode: "27",
    gstin: "27AAEPS8912P1ZV",
  },
  {
    name: "Pooja Verma",
    address: "B-304, Palm Grove Apartments, Lokhandwala Complex, Kandivali East, Mumbai, Maharashtra 400101",
    stateName: "MAHARASHTRA",
    stateCode: "27",
    gstin: "27BAPV6723M1Z8",
  },
  {
    name: "Amit R. Deshmukh",
    address: "14/2, Shanti Niwas, FC Road, Shivaji Nagar, Pune, Maharashtra 411005",
    stateName: "MAHARASHTRA",
    stateCode: "27",
    gstin: "27AAPPD3145K1ZK",
  },
  {
    name: "Mohammed Arif Khan",
    address: "Flat 12, Gulshan Heritage, Hill Road, Bandra West, Mumbai, Maharashtra 400050",
    stateName: "MAHARASHTRA",
    stateCode: "27",
    gstin: "27BAAPK9041L1Z9",
  },
  {
    name: "Sneha Kulkarni",
    address: "Plot 22, Vasant Vihar Society, Paud Road, Kothrud, Pune, Maharashtra 411038",
    stateName: "MAHARASHTRA",
    stateCode: "27",
    gstin: "27AALPK4820R1Z2",
  },
  {
    name: "Vikramaditya Rathore",
    address: "Flat 701, Tower B, Oberoi Woods, Mohan Gokhale Road, Goregaon East, Mumbai, Maharashtra 400063",
    stateName: "MAHARASHTRA",
    stateCode: "27",
    gstin: "27ACZPR1948H1ZF",
  },
];

const sampleProducts = [
  {
    description: "Apple iPhone 15 (128GB, Black)",
    hsnSac: "85171300",
    unit: "Nos",
    defaultRate: 69999,
    defaultGstRatePercent: 18,
  },
  {
    description: "Samsung 55\" Crystal 4K UHD Smart TV (55CUE60AK)",
    hsnSac: "85287200",
    unit: "Nos",
    defaultRate: 43990,
    defaultGstRatePercent: 18,
  },
  {
    description: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    hsnSac: "85183000",
    unit: "Nos",
    defaultRate: 26990,
    defaultGstRatePercent: 18,
  },
  {
    description: "Apple MacBook Air M2 (13.6-inch, 16GB RAM, 256GB SSD)",
    hsnSac: "84713010",
    unit: "Nos",
    defaultRate: 94900,
    defaultGstRatePercent: 18,
  },
  {
    description: "Logitech MX Master 3S Wireless Performance Mouse",
    hsnSac: "84716060",
    unit: "Nos",
    defaultRate: 8995,
    defaultGstRatePercent: 18,
  },
  {
    description: "Boat Airdopes 141 Bluetooth True Wireless Earbuds",
    hsnSac: "85183000",
    unit: "Nos",
    defaultRate: 1299,
    defaultGstRatePercent: 18,
  },
];

const sampleDemoInvoices = [
  {
    sequenceNumber: 1,
    invoiceNumber: "DEMO/26-27/1",
    financialYear: "26-27",
    invoiceDate: "2026-10-01",
    dueDate: "2026-10-15",
    modeOfPayment: "UPI",
    buyersOrderNo: "DEMO-ORD-01",
    dispatchDocNo: "DISP-01",
    deliveryNoteDate: "2026-10-01",
    dispatchedThrough: "In-Store Delivery",
    destination: "Mumbai",
    deliveryAddress: "Flat 402, Building 3, Greenfield Heights, Andheri West, Mumbai, Maharashtra 400053",
    buyerName: "Rahul Sharma",
    buyerAddress: "Flat 402, Building 3, Greenfield Heights, Andheri West, Mumbai, Maharashtra 400053",
    buyerGstin: "27AAEPS8912P1ZV",
    buyerStateName: "MAHARASHTRA",
    buyerStateCode: "27",
    taxMode: "intra",
    gstRatePercent: 18,
    roundOffEnabled: true,
    paymentStatus: "paid",
    paidAmount: null,
    paymentDate: "2026-10-01",
    paymentMethod: "UPI",
    paymentNotes: "Demo UPI payment ref #428910",
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
        description: "Boat Airdopes 141 Bluetooth True Wireless Earbuds",
        hsnSac: "85183000",
        quantity: 1,
        rate: 1299,
        unit: "Nos",
        discountPercent: 0,
        gstRatePercent: 18,
      },
    ],
  },
  {
    sequenceNumber: 2,
    invoiceNumber: "DEMO/26-27/2",
    financialYear: "26-27",
    invoiceDate: "2026-10-02",
    dueDate: "2026-10-16",
    modeOfPayment: "Credit Card",
    buyersOrderNo: "DEMO-ORD-02",
    dispatchDocNo: "DISP-02",
    deliveryNoteDate: "2026-10-02",
    dispatchedThrough: "Home Express Delivery",
    destination: "Mumbai",
    deliveryAddress: "B-304, Palm Grove Apartments, Lokhandwala Complex, Kandivali East, Mumbai, Maharashtra 400101",
    buyerName: "Pooja Verma",
    buyerAddress: "B-304, Palm Grove Apartments, Lokhandwala Complex, Kandivali East, Mumbai, Maharashtra 400101",
    buyerGstin: "27BAPV6723M1Z8",
    buyerStateName: "MAHARASHTRA",
    buyerStateCode: "27",
    taxMode: "intra",
    gstRatePercent: 18,
    roundOffEnabled: true,
    paymentStatus: "paid",
    paidAmount: null,
    paymentDate: "2026-10-02",
    paymentMethod: "Credit Card",
    paymentNotes: "Demo Card Payment ref #88204",
    lines: [
      {
        description: "Samsung 55\" Crystal 4K UHD Smart TV (55CUE60AK)",
        hsnSac: "85287200",
        quantity: 1,
        rate: 43990,
        unit: "Nos",
        discountPercent: 5,
        gstRatePercent: 18,
      },
    ],
  },
  {
    sequenceNumber: 3,
    invoiceNumber: "DEMO/26-27/3",
    financialYear: "26-27",
    invoiceDate: "2026-10-03",
    dueDate: "2026-10-18",
    modeOfPayment: "Net Banking",
    buyersOrderNo: "DEMO-ORD-03",
    dispatchDocNo: "DISP-03",
    deliveryNoteDate: "2026-10-03",
    dispatchedThrough: "Blue Dart Courier",
    destination: "Pune",
    deliveryAddress: "14/2, Shanti Niwas, FC Road, Shivaji Nagar, Pune, Maharashtra 411005",
    buyerName: "Amit R. Deshmukh",
    buyerAddress: "14/2, Shanti Niwas, FC Road, Shivaji Nagar, Pune, Maharashtra 411005",
    buyerGstin: "27AAPPD3145K1ZK",
    buyerStateName: "MAHARASHTRA",
    buyerStateCode: "27",
    taxMode: "intra",
    gstRatePercent: 18,
    roundOffEnabled: true,
    paymentStatus: "part-paid",
    paidAmount: 25000,
    paymentDate: "2026-10-03",
    paymentMethod: "Net Banking",
    paymentNotes: "Advance ₹25,000 paid",
    lines: [
      {
        description: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
        hsnSac: "85183000",
        quantity: 1,
        rate: 26990,
        unit: "Nos",
        discountPercent: 0,
        gstRatePercent: 18,
      },
      {
        description: "Logitech MX Master 3S Wireless Performance Mouse",
        hsnSac: "84716060",
        quantity: 1,
        rate: 8995,
        unit: "Nos",
        discountPercent: 0,
        gstRatePercent: 18,
      },
    ],
  },
  {
    sequenceNumber: 4,
    invoiceNumber: "DEMO/26-27/4",
    financialYear: "26-27",
    invoiceDate: "2026-10-04",
    dueDate: "2026-10-20",
    modeOfPayment: "NEFT / RTGS",
    buyersOrderNo: "DEMO-ORD-04",
    dispatchDocNo: "",
    deliveryNoteDate: "",
    dispatchedThrough: "Store Pickup",
    destination: "Mumbai",
    deliveryAddress: "Flat 12, Gulshan Heritage, Hill Road, Bandra West, Mumbai, Maharashtra 400050",
    buyerName: "Mohammed Arif Khan",
    buyerAddress: "Flat 12, Gulshan Heritage, Hill Road, Bandra West, Mumbai, Maharashtra 400050",
    buyerGstin: "27BAAPK9041L1Z9",
    buyerStateName: "MAHARASHTRA",
    buyerStateCode: "27",
    taxMode: "intra",
    gstRatePercent: 18,
    roundOffEnabled: true,
    paymentStatus: "unpaid",
    paidAmount: 0,
    paymentDate: "",
    paymentMethod: "",
    paymentNotes: "Due on delivery",
    lines: [
      {
        description: "Apple MacBook Air M2 (13.6-inch, 16GB RAM, 256GB SSD)",
        hsnSac: "84713010",
        quantity: 1,
        rate: 94900,
        unit: "Nos",
        discountPercent: 0,
        gstRatePercent: 18,
      },
    ],
  },
  {
    sequenceNumber: 5,
    invoiceNumber: "DEMO/26-27/5",
    financialYear: "26-27",
    invoiceDate: "2026-10-04",
    dueDate: "2026-10-19",
    modeOfPayment: "UPI",
    buyersOrderNo: "DEMO-ORD-05",
    dispatchDocNo: "DISP-05",
    deliveryNoteDate: "2026-10-04",
    dispatchedThrough: "In-Store Pickup",
    destination: "Pune",
    deliveryAddress: "Plot 22, Vasant Vihar Society, Paud Road, Kothrud, Pune, Maharashtra 411038",
    buyerName: "Sneha Kulkarni",
    buyerAddress: "Plot 22, Vasant Vihar Society, Paud Road, Kothrud, Pune, Maharashtra 411038",
    buyerGstin: "27AALPK4820R1Z2",
    buyerStateName: "MAHARASHTRA",
    buyerStateCode: "27",
    taxMode: "intra",
    gstRatePercent: 18,
    roundOffEnabled: true,
    paymentStatus: "paid",
    paidAmount: null,
    paymentDate: "2026-10-04",
    paymentMethod: "UPI",
    paymentNotes: "Paid via Paytm UPI",
    lines: [
      {
        description: "Boat Airdopes 141 Bluetooth True Wireless Earbuds",
        hsnSac: "85183000",
        quantity: 2,
        rate: 1299,
        unit: "Nos",
        discountPercent: 10,
        gstRatePercent: 18,
      },
    ],
  },
];

async function setupIsolatedDemo(client, label) {
  console.log(`\n========================================`);
  console.log(`Configuring Isolated Demo for: ${label}`);
  console.log(`========================================`);

  // 1. Ensure demo user exists
  let demoUser = (await client.execute("SELECT id FROM User WHERE email = 'demo@invoixy.com' LIMIT 1;")).rows[0];
  if (!demoUser) {
    const demoId = "demo_user_" + Math.random().toString(36).slice(2, 10);
    await client.execute({
      sql: `INSERT INTO User (id, email, name, createdAt, updatedAt) VALUES (?, 'demo@invoixy.com', 'Demo Store Owner', datetime('now'), datetime('now'));`,
      args: [demoId],
    });
    demoUser = { id: demoId };
  }
  console.log(`Demo User ID: ${demoUser.id}`);

  // 2. Remove demo user from any non-demo shops (e.g. Umar Shaikh's shops)
  const nonDemoMemberships = await client.execute({
    sql: `SELECT sm.id, sm.shopId, s.name, s.slug FROM ShopMember sm 
          JOIN Shop s ON s.id = sm.shopId 
          WHERE sm.userId = ? AND s.slug != 'invoixy-demo-store';`,
    args: [demoUser.id],
  });

  for (const m of nonDemoMemberships.rows) {
    console.log(`Removing demo user from private shop "${m.name}" (${m.shopId})...`);
    await client.execute({
      sql: "DELETE FROM ShopMember WHERE id = ?;",
      args: [m.id],
    });
  }

  // 3. Find or create dedicated demo shop
  let demoShop = (await client.execute("SELECT id FROM Shop WHERE slug = 'invoixy-demo-store' LIMIT 1;")).rows[0];
  if (!demoShop) {
    const newDemoShopId = "demo_shop_" + Math.random().toString(36).slice(2, 10);
    console.log(`Creating new dedicated demo shop (${newDemoShopId})...`);
    await client.execute({
      sql: `INSERT INTO Shop (id, name, slug, createdAt, updatedAt) 
            VALUES (?, 'Apex Electronics (Demo)', 'invoixy-demo-store', datetime('now'), datetime('now'));`,
      args: [newDemoShopId],
    });
    demoShop = { id: newDemoShopId };
  } else {
    console.log(`Found existing demo shop (${demoShop.id}).`);
    await client.execute({
      sql: `UPDATE Shop SET name = 'Apex Electronics (Demo)', updatedAt = datetime('now') WHERE id = ?;`,
      args: [demoShop.id],
    });
  }

  // 4. Ensure demo user has membership in demo shop
  const demoMember = await client.execute({
    sql: "SELECT id FROM ShopMember WHERE userId = ? AND shopId = ? LIMIT 1;",
    args: [demoUser.id, demoShop.id],
  });
  if (demoMember.rows.length === 0) {
    const memId = "mem_demo_" + Math.random().toString(36).slice(2, 10);
    await client.execute({
      sql: "INSERT INTO ShopMember (id, userId, shopId, role, createdAt) VALUES (?, ?, ?, 'OWNER', datetime('now'));",
      args: [memId, demoUser.id, demoShop.id],
    });
    console.log(`Assigned demo user as OWNER of demo shop.`);
  }

  // 5. Create or update SellerSettings for demo shop
  const existingSeller = await client.execute({
    sql: "SELECT id FROM SellerSettings WHERE shopId = ? LIMIT 1;",
    args: [demoShop.id],
  });

  if (existingSeller.rows.length > 0) {
    await client.execute({
      sql: `UPDATE SellerSettings SET
        companyName = 'Apex Electronics (Demo)',
        address = 'Demo Outlet - Shop 12-14, Phoenix Galleria Mall, Kurla West, Mumbai, Maharashtra 400070',
        pan = 'AAEPA4829G',
        gstin = '27AAEPA4829G1Z4',
        stateName = 'MAHARASHTRA',
        stateCode = '27',
        phone = '+91 98204 77319',
        bankName = 'HDFC BANK',
        bankAccountNo = '50200084920194',
        bankIfsc = 'HDFC0000128',
        bankBranch = 'Kurla West Branch, Mumbai',
        declaration = 'Demo invoice generated for testing purposes. Shows actual price of electronic goods.',
        invoicePrefix = 'DEMO',
        updatedAt = datetime('now')
        WHERE shopId = ?;`,
      args: [demoShop.id],
    });
  } else {
    await client.execute({
      sql: `INSERT INTO SellerSettings (
        companyName, address, pan, gstin, stateName, stateCode, phone,
        bankName, bankAccountNo, bankIfsc, bankBranch, declaration, invoicePrefix,
        logoDataUrl, shopId, createdAt, updatedAt
      ) VALUES (
        'Apex Electronics (Demo)',
        'Demo Outlet - Shop 12-14, Phoenix Galleria Mall, Kurla West, Mumbai, Maharashtra 400070',
        'AAEPA4829G',
        '27AAEPA4829G1Z4',
        'MAHARASHTRA',
        '27',
        '+91 98204 77319',
        'HDFC BANK',
        '50200084920194',
        'HDFC0000128',
        'Kurla West Branch, Mumbai',
        'Demo invoice generated for testing purposes. Shows actual price of electronic goods.',
        'DEMO',
        '',
        ?, datetime('now'), datetime('now')
      );`,
      args: [demoShop.id],
    });
  }
  console.log(`✅ Demo SellerSettings updated.`);

  // 6. Seed Customer Presets for Demo Shop
  console.log(`Seeding 6 customer presets for demo shop...`);
  await client.execute({
    sql: "DELETE FROM Customer WHERE shopId = ?;",
    args: [demoShop.id],
  });

  for (const c of sampleCustomers) {
    await client.execute({
      sql: `INSERT INTO Customer (name, address, gstin, stateName, stateCode, shopId, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'));`,
      args: [c.name, c.address, c.gstin, c.stateName, c.stateCode, demoShop.id],
    });
  }

  // 7. Seed Product Presets for Demo Shop
  console.log(`Seeding 6 product presets for demo shop...`);
  await client.execute({
    sql: "DELETE FROM Product WHERE shopId = ?;",
    args: [demoShop.id],
  });

  for (const p of sampleProducts) {
    await client.execute({
      sql: `INSERT INTO Product (description, hsnSac, unit, defaultRate, defaultGstRatePercent, shopId, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'));`,
      args: [p.description, p.hsnSac, p.unit, p.defaultRate, p.defaultGstRatePercent, demoShop.id],
    });
  }

  // 8. Seed 5 Invoices for Demo Shop
  console.log(`Seeding 5 sample invoices for demo shop...`);
  // Delete existing demo invoices
  const oldDemoInvs = await client.execute({
    sql: "SELECT id FROM Invoice WHERE shopId = ?;",
    args: [demoShop.id],
  });
  for (const inv of oldDemoInvs.rows) {
    await client.execute({ sql: "DELETE FROM InvoiceLine WHERE invoiceId = ?;", args: [inv.id] });
  }
  await client.execute({ sql: "DELETE FROM Invoice WHERE shopId = ?;", args: [demoShop.id] });

  for (const rawInv of sampleDemoInvoices) {
    const inv = calculateInvoice(rawInv);
    const paidAmount = inv.paidAmount === null ? inv.grandTotal : inv.paidAmount;

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
        inv.invoiceNumber, inv.financialYear, inv.sequenceNumber, inv.invoiceDate, inv.modeOfPayment,
        inv.buyersOrderNo, inv.dispatchDocNo, inv.deliveryNoteDate, inv.dispatchedThrough, inv.destination,
        inv.deliveryAddress, inv.dueDate, inv.buyerName, inv.buyerAddress, inv.buyerGstin, inv.buyerStateName,
        inv.buyerStateCode, inv.taxMode, inv.gstRatePercent, inv.roundOffEnabled ? 1 : 0, inv.totalQuantity, inv.subtotal,
        inv.cgstRate, inv.sgstRate, inv.igstRate, inv.cgstAmount, inv.sgstAmount, inv.igstAmount, inv.roundOff,
        inv.grandTotal, inv.amountInWords, inv.paymentStatus, paidAmount, inv.paymentDate, inv.paymentMethod,
        inv.paymentNotes, demoShop.id,
      ],
    });

    const invoiceId = Number(insertRes.lastInsertRowid);

    for (const line of inv.lines) {
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

    console.log(`  ✓ ${inv.invoiceNumber} | ${inv.buyerName} | ₹${inv.grandTotal.toLocaleString("en-IN")} | ${inv.paymentStatus}`);
  }

  // Update sequence for demo shop
  await client.execute({
    sql: `INSERT OR REPLACE INTO InvoiceSequence (financialYear, lastNumber, shopId, createdAt, updatedAt)
          VALUES (?, ?, ?, datetime('now'), datetime('now'));`,
    args: ["26-27", 5, demoShop.id],
  });

  console.log(`✅ ${label}: Demo shop successfully isolated and seeded!`);
}

async function run() {
  try {
    await setupIsolatedDemo(localClient, "Local SQLite (dev.db)");
    if (cloudClient) {
      await setupIsolatedDemo(cloudClient, "Turso Cloud DB");
    } else {
      console.log("Turso Cloud credentials not configured in env.");
    }
    console.log("\n🎉 ALL ISOLATION & DEMO SEEDING COMPLETE!");
  } catch (err) {
    console.error("Setup error:", err);
  }
}

run();
