# 🚀 Invoixy Roadmap

Welcome to the future of **Invoixy**! This roadmap is based on what is actually built in the codebase — nothing assumed. Community feedback and contributions will heavily influence what gets built next.

---

## ✅ v1.0.0 — Foundation (Live & Shipped)

Everything below is fully working in production right now.

### 🧾 Invoice Engine
- [x] GST invoice generation (CGST / SGST / IGST auto-switching by state)
- [x] Auto financial-year invoice numbering with custom prefix (e.g. `ECMUM-2425-001`)
- [x] Multi-line items with per-line HSN/SAC, quantity, rate, unit, and discount
- [x] Multiple GST rates per line (0%, 5%, 12%, 18%, 28%)
- [x] Round-off toggle
- [x] Amount in words (auto-generated)
- [x] Invoice duplication from history
- [x] Invoice editing after creation
- [x] Invoice deletion
- [x] Print-optimised A4 layout
- [x] PDF download via browser API
- [x] Live invoice preview (side-by-side with form)
- [x] Draft auto-save to database (survives page refresh and browser close)

### 💳 Payment Tracking
- [x] Payment status: Unpaid / Part-paid / Paid
- [x] Paid amount tracking
- [x] Payment date, method, and notes
- [x] Overdue badge (auto-triggered by due date)
- [x] Due date field on invoice

### 📊 Dashboard & Analytics
- [x] Total revenue collected
- [x] Total invoices generated
- [x] Outstanding balance
- [x] Paid amount
- [x] Monthly revenue bar chart (billed vs collected, full financial year)
- [x] Accounts receivable aging chart (0–30 / 30–60 / 60–90 / 90+ days)
- [x] Recent invoices list
- [x] Floating action button (quick new invoice)

### 🗂️ Invoice History
- [x] Full invoice list with search and filters
- [x] Filter by payment status, date range, buyer name, GST number
- [x] Sortable columns
- [x] Pagination

### 👥 Customer Management
- [x] Save customers as reusable presets
- [x] Auto-fill buyer details from saved customers
- [x] GSTIN, address, state stored per customer
- [x] Edit and delete customers

### 📦 Product Management
- [x] Save products/services as reusable presets
- [x] Auto-fill line items from saved products
- [x] HSN/SAC, unit, default rate, default GST rate stored per product
- [x] Edit and delete products

### ⚙️ Seller Settings
- [x] Company profile (name, address, PAN, GSTIN, state, phone)
- [x] Bank details (printed on every invoice footer)
- [x] Invoice number prefix customisation
- [x] Company logo upload (stored in database, appears on invoice)
- [x] Declaration text (printed on invoice)
- [x] Database backup download (local mode)
- [x] Database restore from backup file (local mode)

### 🔐 Security & Authentication
- [x] PIN-protected login (6-digit numeric PIN)
- [x] Password-protected login (text password alternative)
- [x] On-screen PIN keypad with keyboard support
- [x] Credentials hashed with bcrypt (never stored in plain text)
- [x] Secure HTTP-only auth cookie (30-day session)
- [x] Change PIN / password from Security settings page
- [x] Premium glassmorphic login UI

### 🗄️ Database & Infrastructure
- [x] Turso libSQL cloud database (production)
- [x] Local SQLite fallback (development / self-hosted)
- [x] Prisma ORM with libSQL adapter
- [x] Next.js 16 App Router with Server Actions

### 🎨 UI & Design
- [x] Glassmorphism design system (purple / indigo brand)
- [x] Fully mobile responsive layout
- [x] Collapsible mobile navigation drawer
- [x] Toast notification system
- [x] Empty states with call-to-action
- [x] Loading skeleton screens
- [x] Smooth hover and transition animations

### 📖 Open Source
- [x] MIT License
- [x] GitHub repository
- [x] README with setup instructions
- [x] CONTRIBUTING guide
- [x] AI context summary for contributors

---

## 🎯 v1.1.0 — Polish & Completeness

*Small but meaningful quality-of-life improvements based on real usage.*

- [ ] **Dark mode** — full dark theme matching the existing brand palette
- [ ] **Custom terms & conditions** — save default terms that auto-fill on every invoice
- [ ] **Flat amount discounts** — currently percentage only; add flat-₹ discount per line item
- [ ] **Sample/demo data** — one-click load of sample invoices for first-time users
- [ ] **Better mobile invoice preview** — currently desktop-optimised; improve mobile scaling
- [ ] **Signature upload** — upload and store a signature image that appears on the invoice
- [ ] **Multiple invoice themes** — at least one alternate invoice layout/style option
- [ ] **Invoice notes field** — free-text notes that print below the line items
- [ ] **Fingerprint / Biometric login** — use device Face ID or fingerprint (WebAuthn / Passkey) as a third login method alongside PIN and password; fastest and most secure option for mobile users

---

## 📈 v1.2.0 — Productivity

*For users generating many invoices regularly.*

- [ ] **Recurring invoices** — set an invoice as recurring, auto-generate monthly
- [ ] **Bulk payment status update** — mark multiple invoices as paid at once
- [ ] **Customer history page** — see all invoices for a specific customer in one view
- [ ] **Customer revenue stats** — total billed, collected, and outstanding per customer
- [ ] **Invoice prefix per financial year** — auto-reset numbering on April 1st
- [ ] **Excel / CSV export** — export invoice list and line items to spreadsheet

---

## 🔔 v1.3.0 — Automation

*Make Invoixy work in the background for you.*

- [ ] **Email invoice** — send PDF directly to client via Resend or SendGrid
- [ ] **Due date reminders** — email alert X days before invoice due date
- [ ] **Overdue alerts** — notification when an invoice crosses its due date unpaid
- [ ] **Payment received notification** — confirmation when status is updated to paid

---

## 👥 v1.4.0 — Team & Collaboration

*For agencies and businesses with multiple team members.*

- [ ] **Multiple users** — invite team members to the same workspace
- [ ] **Role-based access** — admin, editor, view-only roles
- [ ] **Activity log** — see who created, edited, or deleted what and when
- [ ] **Invoice change history** — full audit trail per invoice

---

## 🤖 v1.5.0 — AI Features

*Smarter invoicing powered by AI.*

- [ ] **Natural language invoice creation**
  > *"Create an invoice for Acme Corp — logo design ₹25,000, maintenance ₹15,000, GST 18%"*
- [ ] **Revenue trend predictions** — forecast next month's expected revenue
- [ ] **Outstanding payment risk scoring** — flag which invoices are likely to go overdue
- [ ] **Customer spending insights** — patterns and summaries per customer

---

## 🌐 v2.0.0 — Platform Expansion

*Invoixy as a full-featured platform.*

### 📲 WhatsApp Integration
- [ ] **Share invoice via WhatsApp** — one-tap button on any invoice to share the PDF link directly to a client's WhatsApp
- [ ] **Pre-filled message** — auto-compose a professional message with invoice number, amount due, and due date
- [ ] **WhatsApp Business API** — for high-volume users: automated delivery confirmations and read receipts
- [ ] **Payment reminder via WhatsApp** — send overdue reminders to clients directly on WhatsApp

### 💳 Payments & Integrations
- [ ] **Razorpay integration** — embed "Pay Now" link inside the PDF
- [ ] **UPI payment links** — generate UPI QR code on the invoice
- [ ] **Google Drive backup** — auto-sync database backups to Drive

### 🇮🇳 GST Compliance
- [ ] **GSTR-1 export** — generate the JSON format required by the GST Offline Utility
- [ ] **E-Invoice (IRN)** — direct integration with IRP portal for e-invoice generation

### 🏢 Multi-Business
- [ ] **Multi-business support** — manage multiple GSTINs from one account
- [ ] **Multi-currency** — USD, EUR, GBP for export service businesses

---

## 🌟 Long-Term Vision

Invoixy aims to be the most modern, open-source invoice management platform for Indian freelancers, agencies, and small businesses — combining the simplicity of a self-hosted tool with the power of a commercial SaaS product.

> Built in India 🇮🇳 · GST-native from day one · Open source forever

---

> [!NOTE]
> **Want to contribute?** Every item above is up for grabs. Check [`CONTRIBUTING.md`](./CONTRIBUTING.md) to get started. Feature requests and bug reports are welcome via GitHub Issues.
