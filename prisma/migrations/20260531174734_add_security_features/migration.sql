-- CreateTable
CREATE TABLE "SecuritySettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "authEnabled" BOOLEAN NOT NULL DEFAULT true,
    "authType" TEXT NOT NULL DEFAULT 'PIN',
    "authHash" TEXT,
    "recoveryHash" TEXT,
    "autoLockMinutes" INTEGER NOT NULL DEFAULT 15,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InvoiceDraftRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "draftJson" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_InvoiceDraftRecord" ("draftJson", "id", "updatedAt") SELECT "draftJson", "id", "updatedAt" FROM "InvoiceDraftRecord";
DROP TABLE "InvoiceDraftRecord";
ALTER TABLE "new_InvoiceDraftRecord" RENAME TO "InvoiceDraftRecord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Invoice_paymentStatus_idx" ON "Invoice"("paymentStatus");
