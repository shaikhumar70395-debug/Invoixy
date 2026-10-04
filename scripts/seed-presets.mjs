import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const tursoUrl = process.env.DATABASE_URL;
const tursoToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

const localClient = createClient({ url: "file:./dev.db" });
const cloudClient = (tursoUrl && tursoUrl.startsWith("libsql://") && tursoToken)
  ? createClient({ url: tursoUrl, authToken: tursoToken })
  : null;

const sampleCustomers = [
  {
    name: "Tata Consultancy Services Ltd",
    address: "TCS House, Raveline Street, Fort, Mumbai, Maharashtra 400001",
    stateName: "MAHARASHTRA",
    stateCode: "27",
    gstin: "27AAACT2727Q1ZW",
  },
  {
    name: "Infosys Technologies Pvt Ltd",
    address: "Plot No. 44, Electronic City, Hosur Road, Bengaluru, Karnataka 560100",
    stateName: "KARNATAKA",
    stateCode: "29",
    gstin: "29AABCI1234K1Z5",
  },
  {
    name: "Reliance Retail Ventures",
    address: "3rd Floor, Court House, Lokmanya Tilak Marg, Dhobi Talao, Mumbai, Maharashtra 400002",
    stateName: "MAHARASHTRA",
    stateCode: "27",
    gstin: "27AABCR4567M1ZX",
  },
  {
    name: "Wipro Enterprises",
    address: "Doddakannelli, Sarjapur Road, Bengaluru, Karnataka 560035",
    stateName: "KARNATAKA",
    stateCode: "29",
    gstin: "29AAACW8765L1ZG",
  },
  {
    name: "HCL Global Solutions",
    address: "Technology Hub, Sector 126, Noida, Uttar Pradesh 201304",
    stateName: "UTTAR PRADESH",
    stateCode: "09",
    gstin: "09AAACH5432J1ZP",
  },
  {
    name: "Zomato Media Pvt Ltd",
    address: "Ground Floor, 12A, 94 Meghdoot, Nehru Place, New Delhi, Delhi 110019",
    stateName: "DELHI",
    stateCode: "07",
    gstin: "07AAACZ9876K1ZY",
  },
];

const sampleProducts = [
  {
    description: "Enterprise Cloud ERP Software License (Annual)",
    hsnSac: "997331",
    unit: "Nos",
    defaultRate: 48000,
    defaultGstRatePercent: 18,
  },
  {
    description: "Full-Stack Web & Mobile App Development",
    hsnSac: "998314",
    unit: "Hours",
    defaultRate: 2500,
    defaultGstRatePercent: 18,
  },
  {
    description: "Network Security & IT Infrastructure Audit",
    hsnSac: "998313",
    unit: "Nos",
    defaultRate: 35000,
    defaultGstRatePercent: 18,
  },
  {
    description: "Industrial Ergonomic Office Desk Chairs",
    hsnSac: "940310",
    unit: "Pcs",
    defaultRate: 8500,
    defaultGstRatePercent: 18,
  },
  {
    description: "Premium A4 Bond Copier Paper (500 Sheets/Ream)",
    hsnSac: "480256",
    unit: "Pcs",
    defaultRate: 320,
    defaultGstRatePercent: 12,
  },
  {
    description: "Data Analytics & Business Intelligence Consulting",
    hsnSac: "998311",
    unit: "Days",
    defaultRate: 15000,
    defaultGstRatePercent: 18,
  },
];

async function seedDatabase(client, label) {
  console.log(`\n--- Seeding ${label} ---`);
  
  // Find all shops
  const shopRes = await client.execute("SELECT id, name FROM Shop;");
  if (shopRes.rows.length === 0) {
    console.log(`No shops found in ${label}.`);
    return;
  }

  // Delete all existing customers and products
  console.log(`Deleting existing customer and product presets in ${label}...`);
  await client.execute("DELETE FROM Customer;");
  await client.execute("DELETE FROM Product;");

  // Insert presets for each shop
  for (const shop of shopRes.rows) {
    console.log(`Populating 6 customer & 6 product presets for shop: "${shop.name}" (${shop.id})...`);
    
    for (const cust of sampleCustomers) {
      await client.execute({
        sql: `INSERT INTO Customer (name, address, gstin, stateName, stateCode, shopId, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'));`,
        args: [cust.name, cust.address, cust.gstin, cust.stateName, cust.stateCode, shop.id],
      });
    }

    for (const prod of sampleProducts) {
      await client.execute({
        sql: `INSERT INTO Product (description, hsnSac, unit, defaultRate, defaultGstRatePercent, shopId, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'));`,
        args: [prod.description, prod.hsnSac, prod.unit, prod.defaultRate, prod.defaultGstRatePercent, shop.id],
      });
    }
  }

  const cCount = await client.execute("SELECT COUNT(*) as count FROM Customer;");
  const pCount = await client.execute("SELECT COUNT(*) as count FROM Product;");
  console.log(`✅ ${label} now has ${cCount.rows[0].count} customer presets and ${pCount.rows[0].count} product presets.`);
}

async function run() {
  try {
    await seedDatabase(localClient, "Local SQLite (dev.db)");
    if (cloudClient) {
      await seedDatabase(cloudClient, "Turso Cloud DB");
    } else {
      console.log("Turso Cloud credentials not configured.");
    }
    console.log("\n🎉 ALL PRESETS UPDATED SUCCESSFULLY!");
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

run();
