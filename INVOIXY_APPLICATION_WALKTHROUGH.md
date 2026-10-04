# Invoixy — Application Walkthrough & Feature Guide

> **Application Name:** Invoixy  
> **Application Type:** Multi-Tenant GST Billing & Invoicing SaaS  
> **Live Production URL:** [https://invoixy.vercel.app](https://invoixy.vercel.app)  
> **Reference Store:** Apex Electronics & Appliances (Kurla West, Mumbai, Maharashtra)  

---

## 1. Introduction to Invoixy

Invoixy is a full-stack, cloud-based billing and invoicing platform developed for Indian retail and commercial businesses. It automates the generation of official Goods and Services Tax (GST) invoices in compliance with Rule 46 of the CGST Act.

### Core Problems Solved by the Application:
* **Elimination of Math Errors:** Calculates itemized taxable amounts, tax splitting, and total rounding automatically.
* **Rapid Counter Billing:** Uses 1-click customer and product presets to generate complete bills in under 30 seconds.
* **Pixel-Perfect Document Standards:** Renders an interactive live A4 preview on screen and generates server-side vector PDF invoices with store branding.
* **Multi-Tenant Architecture:** Provides data isolation between private user stores and a dedicated shared demo sandbox.

---

## 2. Business Profile: Apex Electronics & Appliances

The application is pre-configured with a real-world commercial profile to demonstrate real business operations:

* **Business Name:** Apex Electronics & Appliances
* **Address:** Shop No. 12–14, Ground Floor, Phoenix Galleria Mall, LBS Marg, Kurla West, Mumbai, Maharashtra 400070
* **State & Code:** MAHARASHTRA (State Code: `27`)
* **GSTIN:** `27AAEPA4829G1Z4`
* **PAN:** `AAEPA4829G`
* **Contact Phone:** `+91 98204 77319`
* **Bank Remittance Details:** HDFC BANK, Kurla West Branch (A/C: `50200084920194`, IFSC: `HDFC0000128`)
* **Invoice Prefix:** `APEX`

---

## 3. Authentication & Access (`/login`)

The authentication section handles user entry and store tenant allocation:

### Features:
1. **Continue with Google (OAuth 2.0):** Authenticates users via Google. Each authenticated user is automatically provisioned a private store isolated from all other users.
2. **Email Sign-In:** Allows users to access or create a store account directly with an email address.
3. **Instant Demo Access ("Sign in as Demo"):** A one-click sandbox button that immediately mounts the central demo store (*Apex Electronics (Demo)*). Any device opening this demo accesses the exact same pre-seeded store, making it easy to test across laptops, tablets, and phones simultaneously.

---

## 4. Store Dashboard (`/`)

The Dashboard is the central analytics and management overview for the store owner:

### Features:
1. **Financial Metrics Summary:**
   * **Total Revenue:** Aggregated grand total of all invoices issued.
   * **Paid Invoices Count:** Number of settled invoices.
   * **Unpaid Invoices Count:** Outstanding bills requiring payment follow-up.
   * **Total Invoices Issued:** Lifetime bill count.
2. **Recent Invoices Ledger:** Displays the latest 5 issued invoices with buyer names, dates, amounts, and color-coded payment status badges (`Paid`, `Unpaid`, `Part-Paid`).
3. **Quick Action Shortcuts:** Direct navigation buttons to create new invoices or access sales history.

---

## 5. Invoice Creation Workspace (`/invoices/new`)

This is the primary billing engine. On desktop displays, it provides a side-by-side split view: the input form on the left and a live A4 print preview on the right.

### Sub-Sections:

### A. Invoice Header
* **Invoice Number:** Automatically generated using the store's prefix, the current financial year, and sequential counter (*e.g., APEX/26-27/7*). Locked to read-only during creation to prevent duplicate sequence conflicts.
* **Invoice Date & Due Date:** Native date selectors defaulted to the current date and standard 30-day payment term.
* **Payment Terms / Mode:** Custom field for settlement mode (*e.g., IMPS, NEFT, UPI, Cash, Cheque*).
* **Dispatch & Transport Metadata:** Tracks Buyer's Order Number, Dispatch Document Number, Transport/Courier Name, Destination City, and Delivery Note Date.

### B. Buyer (Customer) Details
* **Saved Customer Preset Dropdown:** Selecting a saved customer (*e.g., Rahul Sharma*) automatically populates their full billing address, GSTIN, state name, and state code.
* **Save Buyer as Customer Button:** When entering a new walk-in buyer manually, clicking this button saves their profile directly to the database for future visits.
* **Delivery Address (Optional):** Supports distinct consignee delivery locations when billing and shipping destinations differ.

### C. Line Items (Products & Services Catalog)
* **Saved Product Preset Dropdown:** Selecting an inventory item (*e.g., Sony Bravia 55" TV*) auto-fills description, HSN/SAC code, unit of measurement (*Nos*), unit rate, and default GST rate.
* **Save as Product Button:** Saves custom items directly into the store catalog.
* **HSN / SAC Code:** 4-to-8 digit classification codes required by Indian tax authorities for electronic goods and appliances.
* **Quantity, Unit & Rate:** Dynamic unit price and quantity calculations.
* **Discount Percentage:** Per-item percentage discount deducted before tax calculation.
* **GST Rate Brackets:** Dropdown options for standard rates: `0%`, `5%`, `12%`, `18%`, and `28%`.
* **Add Row & Remove Row:** Supports adding unlimited products to a single invoice.

### D. Automated GST Calculation Engine
* **Automatic Tax Classification:**
  * **Intra-State Sale (Same State):** When the buyer's state code matches the seller's state code (`27` - Maharashtra), tax is automatically divided equally into **CGST** and **SGST** (e.g., 18% total becomes 9% CGST + 9% SGST).
  * **Inter-State Sale (Different State):** When selling to another state (e.g., Gujarat `24`), tax is automatically calculated as **IGST** (18% full).
* **Round-Off Function:** Automatically rounds the invoice grand total to the nearest integer rupee and displays the exact round-off difference (*e.g., +₹0.12*).

### E. Live Interactive A4 Preview
* **Real-Time Synchronization:** Updates immediately with every keystroke in the form.
* **Proportional Scaling:** Maintains exact A4 aspect ratio (1:1.414) on screen.
* **Fit Mode vs. 100% Mode:** Switch between fit-to-width responsive scaling and 100% full-resolution print scale.

---

## 6. Invoice History & Ledger (`/invoices`)

The complete repository of all issued invoices:

### Features:
1. **Live Search Bar:** Real-time filtering by invoice number (*e.g., APEX/26-27/2*) or customer name.
2. **Status Filters:** Instant tab filtering by **All**, **Paid**, **Part-Paid**, or **Unpaid**.
3. **Action Menu:**
   * **View (`/invoices/[id]`):** Opens the standalone invoice sheet.
   * **Edit (`/invoices/[id]/edit`):** Updates draft or unpaid invoices.
   * **Print / PDF:** Downloads the PDF directly from the list.
   * **Delete:** Removes the record with confirmation safety checks.

---

## 7. Single Invoice Details & PDF Generation (`/invoices/[id]`)

A dedicated page for reviewing individual bills and issuing official documents:

### Features:
1. **Full Tax Invoice Presentation:** Displays company details, customer details, itemized table, and tax summaries.
2. **Payment Tracking:** Allows updating payment status (`Paid` / `Unpaid`) and recording partial payments with settlement dates.
3. **Server-Side Vector PDF Engine (`/api/invoices/[id]/pdf`):**
   * Uses **PDFKit** on the server to generate standardized A4 vector documents.
   * Embeds the high-resolution **Apex Electronics logo**.
   * Formats the itemized table with HSN codes, rates, and amounts.
   * Displays the separate **GST Tax Breakup Table**.
   * Includes bank remittance instructions (Bank name, Account number, IFSC code).
   * Generates formal **Indian Currency Words** (*e.g., "INR Seventy-Six Thousand Six Hundred Eighty-Eight Only"*).

---

## 8. Customer Presets Directory (`/customers`)

Manages client profiles and business accounts:

### Features:
* **Directory List:** Displays saved customer cards with full names, addresses, GSTIN credentials, and state codes.
* **Pre-Seeded Profiles:** Includes realistic retail and commercial buyers:
  * *Rahul Sharma* (Kurla West, Mumbai)
  * *Pooja Verma* (Andheri East, Mumbai)
  * *Amit R. Deshmukh* (Thane West)
  * *Mohammed Arif Khan* (Bandra Kurla Complex)
  * *Sneha Kulkarni* (Dadar West)
  * *Vikramaditya Rathore* (Ahmedabad, Gujarat — Inter-State IGST client)
* **Create / Edit / Delete:** Full management of customer records.

---

## 9. Product Catalog Presets (`/products`)

Manages inventory items and standard price lists:

### Features:
* **Product Catalog:** Displays inventory cards with product descriptions, HSN/SAC codes, default prices, and tax brackets.
* **Pre-Seeded Electronics Inventory:**
  * *Sony Bravia 55" 4K Google TV* (HSN: `8528`, ₹64,990, 18% GST)
  * *Apple MacBook Pro 14"* (HSN: `8471`, ₹1,99,900, 18% GST)
  * *Samsung 1.5 Ton Inverter AC* (HSN: `8415`, ₹44,990, 28% GST)
  * *LG 343L Smart Refrigerator* (HSN: `8418`, ₹38,500, 18% GST)
  * *Dyson V12 Detect Vacuum Cleaner* (HSN: `8508`, ₹52,900, 18% GST)
  * *Bose QuietComfort Ultra Headphones* (HSN: `8518`, ₹35,900, 18% GST)
* **Inventory Management:** Add new products, update prices, or adjust tax categories.

---

## 10. Seller Profile & Store Settings (`/settings`)

The store identity configuration area:

### Features:
1. **Company Details:** Company name, registered billing address, phone, PAN, GSTIN, state name, state code, and custom invoice numbering prefix.
2. **Branding & Logo Management:** Upload store logo (PNG/JPG). Scaled, stored, and embedded across live previews and PDF exports.
3. **Bank Account Details:** Bank name, branch, account number, and IFSC code for direct wire transfers.
4. **Declaration & Terms:** Standard commercial disclaimer and warranty policy printed on invoice footers.
5. **Database Backup & Restore:** (Local mode) Download SQLite database backup and restore from file.

---

## 11. Counter Security & Auto-Lock (`/security`)

Designed for retail store terminals:

### Features:
* **Inactivity Auto-Lock:** Monitors user activity and automatically locks the billing screen if the counter is left unattended for a set period (e.g., 5, 15, or 30 minutes).
* **PIN / Passcode Protection:** Requires entering the security credential to unlock, preventing unauthorized changes to bills or pricing.

---

## 12. Accounting Data Export (`/api/export`)

Provides data exports for accountants and tax filing:

### Features:
1. **Invoice Summary Export (`/api/export`):** Generates a CSV file containing date, invoice number, customer name, GSTIN, taxable subtotal, CGST, SGST, IGST, and grand total per bill.
2. **Detailed Line Items Export (`/api/export/lines`):** Generates an itemized CSV file listing every product sold, quantities, rates, and HSN codes for sales reporting and inventory reconciliation.

---

## 13. System Architecture & Technical Specifications

* **Frontend & Backend Framework:** Next.js 16 (App Router) with React 19 and Server Actions.
* **Type System:** TypeScript 5 with strict static typing across all financial calculations.
* **Database & ORM:** Prisma ORM 7.8 with a 10-model relational schema.
* **Cloud Database Engine:** Turso (distributed LibSQL SQLite engine) hosted in AWS Mumbai (`ap-south-1`).
* **Document Engine:** PDFKit server-side vector generator.
* **Security Model:** Signed JWT tokens stored in `HttpOnly`, `SameSite: Lax`, and `Secure` cookies.
* **Multi-Tenancy:** Complete tenant isolation enforced through mandatory `shopId` foreign key filters on all queries.
