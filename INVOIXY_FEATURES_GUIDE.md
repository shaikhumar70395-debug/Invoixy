# Invoixy — Complete Features & Functional Walkthrough Guide

> **Project Name:** Invoixy  
> **Tagline:** Modern, GST-Compliant Billing & Invoicing SaaS  
> **Reference Business Profile:** Apex Electronics & Appliances (Mumbai, Maharashtra)  
> **Live Production URL:** [https://invoixy.vercel.app](https://invoixy.vercel.app)  

---

## 1. Project Overview (What is Invoixy?)

**Invoixy** is a web-based, production-ready invoicing application built specifically for small-to-medium retail and wholesale businesses in India. It solves the everyday headaches shopkeepers and business owners face when generating GST tax invoices:

1. **Manual Math Errors:** In traditional paper billing or spreadsheets, calculating CGST, SGST, IGST, discounts, and rounding off totals often leads to mistakes. Invoixy automates all calculations in real time.
2. **Speed & Customer Wait Time:** During peak retail hours, customers hate waiting for bills. With Invoixy's **1-Click Presets**, a shopkeeper can pick a saved customer, pick a product, and print an invoice in under 30 seconds.
3. **Professional Branding:** Small businesses often have messy printouts. Invoixy renders an official, A4-standard Indian Tax Invoice complete with the store's high-tech logo, HSN codes, bank payment instructions, and warranty declarations.
4. **Cloud Accessibility & Zero Installation:** Runs in any modern web browser on laptops, desktops, tablets, or phones without requiring any software installation.

---

## 2. Real-World Business Persona: Apex Electronics & Appliances

To demonstrate practical business value during your presentation, Invoixy comes pre-configured with a realistic, high-volume retail electronics business:

* **Store Name:** Apex Electronics & Appliances
* **Address:** Shop No. 12–14, Ground Floor, Phoenix Galleria Mall, LBS Marg, Kurla West, Mumbai, Maharashtra 400070
* **State & Code:** MAHARASHTRA (State Code: `27`)
* **GSTIN:** `27AAEPA4829G1Z4`
* **PAN:** `AAEPA4829G`
* **Contact Phone:** `+91 98204 77319`
* **Bank Remittance:** HDFC BANK, Kurla West Branch (A/C: `50200084920194`, IFSC: `HDFC0000128`)
* **Standard Invoice Prefix:** `APEX` (e.g., `APEX/26-27/1`)

### Why an Electronics Store?
Electronics retail is the best showcase for GST software because:
* Products span multiple GST tax slabs (e.g., 18% for computers & headphones, 28% for large air conditioners).
* Involves high-ticket items requiring precise serial numbers and HSN codes for warranty verification.
* Customers include both local walk-in retail buyers (Intra-state CGST + SGST) and corporate out-of-state buyers (Inter-state IGST).

---

## 3. Landing & Authentication Flow (`/login`)

When anyone visits Invoixy, they are greeted by a clean, modern sign-in screen designed for high security and frictionless onboarding:

### A. Continue with Google (OAuth 2.0)
* One-click sign-in using any Google account.
* Once authorized, the user is automatically assigned their own **private store**, isolated from other users.

### B. Business Email Sign-In
* For users who prefer not to link Google, typing a business email instantly opens or creates their dedicated store dashboard with a secure 30-day session cookie.

### C. "Sign in as Demo" (Instant Cloud Sandbox)
* **Crucial for your college presentation!**
* Clicking **"Want to test first? Sign in as Demo →"** immediately opens a dedicated, pre-loaded demo store (*Apex Electronics (Demo)*).
* **Multi-Device Sync:** If your professor opens the demo link on their phone and you open it on the projector laptop, both devices open the exact same shared central demo store with pre-seeded invoices, products, and customers.

---

## 4. Main Navigation & Store Switcher

The top navigation bar provides instant access to every part of the application:

1. **Brand Logo & Store Badge:** Displays the Invoixy logo alongside an active store badge (*e.g., Apex Electronics & Appliances*).
2. **Dashboard (`/`):** Summary metrics, revenue totals, and recent activity.
3. **New Invoice (`/invoices/new`):** The primary billing workspace.
4. **History (`/invoices`):** Searchable invoice ledger and status management.
5. **Customers (`/customers`):** Preset buyer directory.
6. **Products (`/products`):** Preset product and HSN pricing catalog.
7. **Seller (`/settings`):** Company details, logo upload, and bank instructions.
8. **Security (`/security`):** Counter-lock and inactivity timer.
9. **User Menu (Top Right):** Displays the user's name, active store, and Logout button.

---

## 5. Dashboard Overview (`/`)

The Dashboard is the command center for the store owner. It provides:
* **Metric Cards:** Total Revenue Generated, Paid Invoices count, Pending/Unpaid Invoices count, and Total Invoices Issued.
* **Quick Action Buttons:** Direct shortcuts to create a new invoice or view sales history.
* **Recent Invoices Table:** Displays the 5 most recently created invoices with customer names, dates, amounts, and payment status badges.

---

## 6. The Core Feature: Invoice Creation Workspace (`/invoices/new`)

This is the most powerful page in Invoixy. On desktop screens, it provides a **side-by-side interactive split view**:
* **Left Column:** The data entry form.
* **Right Column:** A live, pixel-perfect A4 invoice print preview that updates as you type.

### Section 1: Header Details
* **Invoice Number:** Automatically generated based on the store's prefix, current financial year, and sequence counter (*e.g., APEX/26-27/7*). Read-only during creation to prevent duplicate numbering conflicts.
* **Invoice Date & Due Date:** Native date pickers defaulted to today's date and a 30-day payment term.
* **Payment Mode / Terms:** Custom field (e.g., *IMPS / NEFT / UPI / Cash / Net 30*).
* **Order & Dispatch Metadata:** Includes Buyer's Order No., Dispatch Doc No., Dispatched Through (courier/transport), Destination city, and Delivery Note Date.

### Section 2: Buyer (Customer) Details
* **Saved Customer Dropdown:** Click the dropdown to pick any saved customer (*e.g., Rahul Sharma*). All customer data (billing address, state name, state code, GSTIN) auto-populates instantly.
* **"Save buyer as customer" Button:** If entering a new walk-in customer manually, clicking this button immediately saves them to your database preset list for future visits.
* **Delivery Address (Optional):** Supports separate "Consignee / Delivery Address" when goods are billed to one address but delivered elsewhere.

### Section 3: Line Items (Goods / Services Table)
* **Saved Product Dropdown:** Select from saved inventory (*e.g., Sony Bravia 55" TV*). Automatically fills description, HSN code, unit (*Nos/Pcs*), default price, and applicable GST rate.
* **"Save as product" Button:** Quickly save newly typed item descriptions and rates to the permanent catalog.
* **HSN / SAC Code:** 4-to-8 digit classification code required by Indian GST law for tax verification.
* **Quantity, Unit & Rate:** Unit price and quantity inputs.
* **Discount %:** Applies per-item percentage discounts before tax calculation.
* **GST Rate Dropdown:** Supports standard GST brackets: `0%`, `5%`, `12%`, `18%`, and `28%`.
* **Add Row / Remove Row:** Add unlimited line items to a single bill.

### Section 4: Automated GST Tax Calculation Engine
* **Automatic State Detection:** When you pick a buyer, Invoixy compares the seller's state code (`27` - Maharashtra) with the buyer's state code:
  * **Intra-State (Same State):** If buyer is also in Maharashtra (`27`), the engine automatically splits tax into **CGST (Central GST)** and **SGST (State GST)** (e.g., 18% total becomes 9% CGST + 9% SGST).
  * **Inter-State (Different State):** If buyer is from Gujarat (`24`) or Delhi (`07`), the engine automatically switches to **IGST (Integrated GST)** (18% full).
* **Round-off Toggle:** Automatically rounds grand totals to the nearest integer rupee (*e.g., ₹94,399.88 rounds to ₹94,400.00 with a +₹0.12 round-off line*).

### Section 5: Real-Time Live A4 Print Preview
* **True-to-Scale A4 Rendering:** Scaled to fit comfortably on screen while maintaining exact print proportions (1:1.414 aspect ratio).
* **Fit vs. 100% Modes:** Switch between fit-to-width and actual print scale.
* **Live Synchronization:** Every keystroke in the form immediately reflects in the preview sheet.

---

## 7. Customer Presets Directory (`/customers`)

Manages regular clients and vendors:
* **Pre-Seeded Real Profiles:** Comes pre-loaded with realistic Indian retail and commercial customers:
  1. *Rahul Sharma* (Kurla West, Mumbai — Retail Customer)
  2. *Pooja Verma* (Andheri East, Mumbai — Interior Designer)
  3. *Amit R. Deshmukh* (Thane West — IT Contractor)
  4. *Mohammed Arif Khan* (Bandra Kurla Complex, Mumbai — Tech Consultant)
  5. *Sneha Kulkarni* (Dadar West, Mumbai — Architect)
  6. *Vikramaditya Rathore* (Ahmedabad, Gujarat — Commercial Client with IGST)
* **Customer Card Details:** Displays Customer Name, GSTIN, complete address, and State Code.
* **Add New Customer:** Modal form to save name, address, GSTIN, and state.

---

## 8. Product Catalog Presets (`/products`)

Manages the store's inventory and standard pricing:
* **Pre-Seeded Electronics Catalog:**
  1. *Sony Bravia 55" 4K Ultra HD Smart Google TV* (HSN: `8528`, ₹64,990, 18% GST)
  2. *Apple MacBook Pro 14" (M3 Pro, 18GB Unified Memory, 512GB SSD)* (HSN: `8471`, ₹1,99,900, 18% GST)
  3. *Samsung 1.5 Ton 5-Star Inverter Split Air Conditioner (Copper)* (HSN: `8415`, ₹44,990, 28% GST)
  4. *LG 343L 3-Star Smart Inverter Frost-Free Double Door Refrigerator* (HSN: `8418`, ₹38,500, 18% GST)
  5. *Dyson V12 Detect Slim Wireless Vacuum Cleaner* (HSN: `8508`, ₹52,900, 18% GST)
  6. *Bose QuietComfort Ultra Wireless Noise Cancelling Headphones* (HSN: `8518`, ₹35,900, 18% GST)
* **Instant Auto-Fill:** When chosen on an invoice, these presets eliminate repetitive typing and pricing errors.

---

## 9. Invoices Ledger & History (`/invoices`)

A comprehensive ledger of all invoices issued by the store:
* **Global Search:** Instant live filter by invoice number (e.g. `APEX/26-27/3`) or buyer name.
* **Status Filter:** Filter invoices by **All**, **Paid**, **Part-Paid**, or **Unpaid**.
* **Direct Actions:**
  * **View (`/invoices/[id]`):** Open the detailed invoice view.
  * **Edit (`/invoices/[id]/edit`):** Modify draft or unpaid invoices.
  * **Print / PDF:** Direct one-click download of the invoice PDF.
  * **Delete:** Secure removal with confirmation modal.

---

## 10. Single Invoice View & PDF Generation (`/invoices/[id]`)

* **Detailed Invoice Breakdown:** Displays the full Tax Invoice layout on screen.
* **Payment Status Management:** Record payments directly on the invoice (mark as Paid, update paid amount).
* **Server-Side PDF Generation (`/api/invoices/[id]/pdf`):**
  * Built using `pdfkit`.
  * Generates high-resolution, vector-crisp PDF files matching standard Indian Tax Invoice requirements.
  * Includes the **Apex Electronics logo**, complete tax breakdown table, bank remittance slip, and amount in words.

---

## 11. Seller Settings & Branding (`/settings`)

Allows business owners to configure their store profile:
* **Company Details:** Company name, phone number, registered billing address, PAN, GSTIN, state name, state code, and custom invoice prefix.
* **Branding & Logo Upload:** Upload an image logo (PNG/JPG). Stored securely and printed on all invoice headers and PDFs.
* **Bank Account Details:** Bank name, branch, account number, and IFSC code for customer remittances.
* **Declaration & Terms:** Standard disclaimer and warranty policy printed on invoice footers.
* **Database Backup & Restore:** (Local development mode) One-click download of the SQLite database and safe restoration from file.

---

## 12. Accounting Data Export (`/api/export`)

For tax filing and accounting in tools like Tally or Excel:
1. **Summary Export (`/api/export`):** Downloads a clean CSV report listing all issued invoices, dates, buyer names, GSTINs, taxable amounts, CGST, SGST, IGST, and Grand Totals.
2. **Detailed Line Items Export (`/api/export/lines`):** Exports an itemized CSV report with individual product sales, quantities, rates, and HSN codes.

---

## 13. Retail Counter Security & Auto-Lock (`/security`)

Designed specifically for physical retail store counters:
* **Inactivity Auto-Lock:** Automatically locks the screen if the cashier steps away from the counter for a configurable timeout (e.g., 5, 15, or 30 minutes).
* **PIN / Passcode Protection:** Prevents unauthorized tampering with invoices or pricing when the terminal is unattended.

---

## 14. Summary of Key User Benefits

| Feature | Business Problem Solved |
| :--- | :--- |
| **Instant Presets** | Reduces billing time from 5 minutes to 30 seconds per customer. |
| **Automated GST Engine** | Eliminates manual tax math mistakes and state code miscalculations. |
| **Live A4 Preview** | What you see on screen is 100% identical to the printed bill. |
| **Multi-Tenant Demo Sandbox** | Allows examiners and clients to test the live app instantly from any device. |
| **Vector PDF Generator** | Produces professional, GST-compliant tax invoices with embedded logo. |
| **CSV / Excel Export** | Simplifies monthly GSTR-1 tax filing for accountants. |
