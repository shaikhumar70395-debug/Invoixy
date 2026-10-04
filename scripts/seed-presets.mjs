import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const tursoUrl = process.env.DATABASE_URL;
const tursoToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

const localClient = createClient({ url: "file:./dev.db" });
const cloudClient = (tursoUrl && tursoUrl.startsWith("libsql://") && tursoToken)
  ? createClient({ url: tursoUrl, authToken: tursoToken })
  : null;

const electronicSellerProfile = {
  companyName: "Apex Electronics & Appliances",
  address: "Shop No. 12-14, Ground Floor, Phoenix Galleria Mall, LBS Marg, Kurla West, Mumbai, Maharashtra 400070",
  pan: "AAEPA4829G",
  gstin: "27AAEPA4829G1Z4",
  stateName: "MAHARASHTRA",
  stateCode: "27",
  phone: "+91 98204 77319",
  bankName: "HDFC BANK",
  bankAccountNo: "50200084920194",
  bankIfsc: "HDFC0000128",
  bankBranch: "Kurla West Branch, Mumbai",
  invoicePrefix: "APEX",
  declaration:
    "We declare that this invoice shows the actual price of the electronic goods described and that all particulars are true and correct. Goods once sold are covered under respective manufacturer warranty.",
};

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

async function seedDatabase(client, label) {
  console.log(`\n========================================`);
  console.log(`Seeding and Updating: ${label}`);
  console.log(`========================================`);

  // 1. Fetch shops
  const shopRes = await client.execute("SELECT id, name FROM Shop;");
  if (shopRes.rows.length === 0) {
    console.log(`No shops found in ${label}. Updating default SellerSettings table...`);
  }

  // 2. Update Shop Names & Seller Settings
  for (const shop of shopRes.rows) {
    console.log(`Setting business details for shop "${shop.name}" (${shop.id})...`);
    await client.execute({
      sql: "UPDATE Shop SET name = ?, updatedAt = datetime('now') WHERE id = ?;",
      args: [electronicSellerProfile.companyName, shop.id],
    });

    const existingSeller = await client.execute({
      sql: "SELECT id FROM SellerSettings WHERE shopId = ? LIMIT 1;",
      args: [shop.id],
    });

    if (existingSeller.rows.length > 0) {
      await client.execute({
        sql: `UPDATE SellerSettings SET 
          companyName = ?, address = ?, pan = ?, gstin = ?, stateName = ?, stateCode = ?, 
          phone = ?, bankName = ?, bankAccountNo = ?, bankIfsc = ?, bankBranch = ?, 
          declaration = ?, invoicePrefix = ?, updatedAt = datetime('now')
          WHERE shopId = ?;`,
        args: [
          electronicSellerProfile.companyName,
          electronicSellerProfile.address,
          electronicSellerProfile.pan,
          electronicSellerProfile.gstin,
          electronicSellerProfile.stateName,
          electronicSellerProfile.stateCode,
          electronicSellerProfile.phone,
          electronicSellerProfile.bankName,
          electronicSellerProfile.bankAccountNo,
          electronicSellerProfile.bankIfsc,
          electronicSellerProfile.bankBranch,
          electronicSellerProfile.declaration,
          electronicSellerProfile.invoicePrefix,
          shop.id,
        ],
      });
      console.log(`✅ Updated existing SellerSettings for shop ${shop.id}.`);
    } else {
      await client.execute({
        sql: `INSERT INTO SellerSettings (
          companyName, address, pan, gstin, stateName, stateCode, phone,
          bankName, bankAccountNo, bankIfsc, bankBranch, declaration, invoicePrefix,
          logoDataUrl, shopId, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, datetime('now'), datetime('now'));`,
        args: [
          electronicSellerProfile.companyName,
          electronicSellerProfile.address,
          electronicSellerProfile.pan,
          electronicSellerProfile.gstin,
          electronicSellerProfile.stateName,
          electronicSellerProfile.stateCode,
          electronicSellerProfile.phone,
          electronicSellerProfile.bankName,
          electronicSellerProfile.bankAccountNo,
          electronicSellerProfile.bankIfsc,
          electronicSellerProfile.bankBranch,
          electronicSellerProfile.declaration,
          electronicSellerProfile.invoicePrefix,
          shop.id,
        ],
      });
      console.log(`✅ Created SellerSettings for shop ${shop.id}.`);
    }
  }

  // Also update singleton SellerSettings (id = 1) if present
  await client.execute({
    sql: `UPDATE SellerSettings SET 
      companyName = ?, address = ?, pan = ?, gstin = ?, stateName = ?, stateCode = ?, 
      phone = ?, bankName = ?, bankAccountNo = ?, bankIfsc = ?, bankBranch = ?, 
      declaration = ?, invoicePrefix = ?, updatedAt = datetime('now')
      WHERE id = 1;`,
    args: [
      electronicSellerProfile.companyName,
      electronicSellerProfile.address,
      electronicSellerProfile.pan,
      electronicSellerProfile.gstin,
      electronicSellerProfile.stateName,
      electronicSellerProfile.stateCode,
      electronicSellerProfile.phone,
      electronicSellerProfile.bankName,
      electronicSellerProfile.bankAccountNo,
      electronicSellerProfile.bankIfsc,
      electronicSellerProfile.bankBranch,
      electronicSellerProfile.declaration,
      electronicSellerProfile.invoicePrefix,
    ],
  });

  // 3. Delete all existing customers and products
  console.log(`Deleting previous customer and product presets in ${label}...`);
  await client.execute("DELETE FROM Customer;");
  await client.execute("DELETE FROM Product;");

  // 4. Insert new presets for each shop
  for (const shop of shopRes.rows) {
    console.log(`Populating 6 local customer & 6 electronic product presets for shop: "${electronicSellerProfile.companyName}" (${shop.id})...`);

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
      console.log("Turso Cloud credentials not configured in env.");
    }
    console.log("\n🎉 ALL SELLER SETTINGS, CUSTOMERS & PRODUCTS UPDATED TO ELECTRONIC BUSINESS!");
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

run();
