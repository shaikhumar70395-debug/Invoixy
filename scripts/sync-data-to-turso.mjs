import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const tursoUrl = process.env.DATABASE_URL;
const tursoToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoUrl.startsWith("libsql://") || !tursoToken) {
  console.error("Missing Turso configuration in env");
  process.exit(1);
}

console.log("Connecting to local dev.db and Turso cloud...");
const localDb = createClient({ url: "file:./dev.db" });
const cloudClient = createClient({ url: tursoUrl, authToken: tursoToken });

async function sync() {
  try {
    // 1. Get the cloud user and shop
    const userRes = await cloudClient.execute("SELECT * FROM User LIMIT 1;");
    const shopRes = await cloudClient.execute("SELECT * FROM Shop LIMIT 1;");

    if (userRes.rows.length === 0 || shopRes.rows.length === 0) {
      console.log("No cloud user/shop found yet.");
      return;
    }

    const cloudUser = userRes.rows[0];
    const cloudShop = shopRes.rows[0];
    console.log(`Cloud User: ${cloudUser.email} (${cloudUser.id})`);
    console.log(`Cloud Shop: ${cloudShop.name} (${cloudShop.id})`);

    // 2. Read local data from dev.db
    const localSellerRes = await localDb.execute("SELECT * FROM SellerSettings WHERE shopId = 'cmuptozju0000focdksusiz59' OR companyName = 'Nexus Tech Solutions' LIMIT 1;");
    const localSeller = localSellerRes.rows[0];

    const localCustomersRes = await localDb.execute("SELECT * FROM Customer WHERE shopId = 'cmuptozju0000focdksusiz59';");
    const localCustomers = localCustomersRes.rows;

    const localProductsRes = await localDb.execute("SELECT * FROM Product WHERE shopId = 'cmuptozju0000focdksusiz59';");
    const localProducts = localProductsRes.rows;

    const localInvoicesRes = await localDb.execute("SELECT * FROM Invoice WHERE shopId = 'cmuptozju0000focdksusiz59';");
    const localInvoices = localInvoicesRes.rows;

    const localLinesRes = await localDb.execute("SELECT * FROM InvoiceLine;");
    const localLines = localLinesRes.rows;

    const localSequencesRes = await localDb.execute("SELECT * FROM InvoiceSequence;");
    const localSequences = localSequencesRes.rows;

    // 3. Update Cloud Shop name to Nexus Tech Solutions
    if (localSeller) {
      console.log(`Updating Cloud Shop to ${localSeller.companyName}...`);
      await cloudClient.execute({
        sql: "UPDATE Shop SET name = ? WHERE id = ?;",
        args: [localSeller.companyName, cloudShop.id],
      });

      // Update or insert SellerSettings for cloud shop
      const existingSeller = await cloudClient.execute({
        sql: "SELECT id FROM SellerSettings WHERE shopId = ? LIMIT 1;",
        args: [cloudShop.id],
      });

      if (existingSeller.rows.length > 0) {
        await cloudClient.execute({
          sql: `UPDATE SellerSettings SET 
            companyName = ?, address = ?, pan = ?, gstin = ?, stateName = ?, stateCode = ?, 
            phone = ?, bankName = ?, bankAccountNo = ?, bankIfsc = ?, bankBranch = ?, 
            declaration = ?, invoicePrefix = ?, logoDataUrl = ?, updatedAt = datetime('now')
            WHERE shopId = ?;`,
          args: [
            localSeller.companyName, localSeller.address, localSeller.pan, localSeller.gstin,
            localSeller.stateName, localSeller.stateCode, localSeller.phone, localSeller.bankName,
            localSeller.bankAccountNo, localSeller.bankIfsc, localSeller.bankBranch,
            localSeller.declaration, localSeller.invoicePrefix, localSeller.logoDataUrl || "",
            cloudShop.id,
          ],
        });
        console.log("✅ Updated cloud SellerSettings with local business profile.");
      }
    }

    // 4. Sync Customers
    for (const c of localCustomers) {
      await cloudClient.execute({
        sql: `INSERT OR REPLACE INTO Customer (id, name, address, gstin, stateName, stateCode, shopId, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'));`,
        args: [c.id, c.name, c.address, c.gstin, c.stateName, c.stateCode, cloudShop.id],
      });
    }
    console.log(`✅ Synced ${localCustomers.length} customer(s) to cloud.`);

    // 5. Sync Products
    for (const p of localProducts) {
      await cloudClient.execute({
        sql: `INSERT OR REPLACE INTO Product (id, description, hsnSac, unit, defaultRate, defaultGstRatePercent, shopId, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'));`,
        args: [p.id, p.description, p.hsnSac, p.unit, p.defaultRate, p.defaultGstRatePercent, cloudShop.id],
      });
    }
    console.log(`✅ Synced ${localProducts.length} product(s) to cloud.`);

    // 6. Sync Invoices & Lines
    for (const inv of localInvoices) {
      await cloudClient.execute({
        sql: `INSERT OR REPLACE INTO Invoice (
          id, invoiceNumber, financialYear, sequenceNumber, invoiceDate, modeOfPayment,
          buyersOrderNo, dispatchDocNo, deliveryNoteDate, dispatchedThrough, destination,
          deliveryAddress, dueDate, buyerName, buyerAddress, buyerGstin, buyerStateName,
          buyerStateCode, taxMode, gstRatePercent, roundOffEnabled, totalQuantity, subtotal,
          cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount, roundOff,
          grandTotal, amountInWords, paymentStatus, paidAmount, paymentDate, paymentMethod,
          paymentNotes, shopId, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        );`,
        args: [
          inv.id, inv.invoiceNumber, inv.financialYear, inv.sequenceNumber, inv.invoiceDate,
          inv.modeOfPayment, inv.buyersOrderNo, inv.dispatchDocNo, inv.deliveryNoteDate,
          inv.dispatchedThrough, inv.destination, inv.deliveryAddress, inv.dueDate,
          inv.buyerName, inv.buyerAddress, inv.buyerGstin, inv.buyerStateName,
          inv.buyerStateCode, inv.taxMode, inv.gstRatePercent, inv.roundOffEnabled,
          inv.totalQuantity, inv.subtotal, inv.cgstRate, inv.sgstRate, inv.igstRate,
          inv.cgstAmount, inv.sgstAmount, inv.igstAmount, inv.roundOff, inv.grandTotal,
          inv.amountInWords, inv.paymentStatus, inv.paidAmount, inv.paymentDate,
          inv.paymentMethod, inv.paymentNotes, cloudShop.id, inv.createdAt, inv.updatedAt,
        ],
      });
    }

    for (const line of localLines) {
      await cloudClient.execute({
        sql: `INSERT OR REPLACE INTO InvoiceLine (
          id, invoiceId, lineOrder, description, hsnSac, quantity, rate, unit,
          discountPercent, gstRatePercent, cgstAmount, sgstAmount, igstAmount, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          line.id, line.invoiceId, line.lineOrder, line.description, line.hsnSac,
          line.quantity, line.rate, line.unit, line.discountPercent, line.gstRatePercent,
          line.cgstAmount, line.sgstAmount, line.igstAmount, line.amount,
        ],
      });
    }
    console.log(`✅ Synced ${localInvoices.length} invoice(s) with ${localLines.length} lines.`);

    for (const seq of localSequences) {
      await cloudClient.execute({
        sql: `INSERT OR REPLACE INTO InvoiceSequence (financialYear, lastNumber, shopId, createdAt, updatedAt)
              VALUES (?, ?, ?, datetime('now'), datetime('now'));`,
        args: [seq.financialYear, seq.lastNumber, cloudShop.id],
      });
    }
    console.log("✅ Synced invoice sequences.");

    console.log("\n🎉 ALL LOCAL DATA SUCCESSFULLY SYNCED TO TURSO CLOUD!");
  } catch (err) {
    console.error("Sync error:", err);
  }
}

sync();
