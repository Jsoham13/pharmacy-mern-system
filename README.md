# 🏥 Shree Ganesh Medical & General Stores
### Complete Full-Stack Medical Store Management & Retail Pharmacy System (MERN Stack)
*Developed for Retail Pharmacy Operations in Sangli, Maharashtra, India*

---

## 🚀 Teammate Tech Stack Compliance Matrix

| Subsystem | Requested Technology | Implementation Status | Notes |
| :--- | :--- | :---: | :--- |
| **Frontend** | React + Vite | ✅ | Vite 5.3 + React 18 SPA |
| | JavaScript | ✅ | Modern ES6+ |
| | Tailwind CSS | ✅ | Custom Medical Theme + Responsive |
| | React Router | ✅ | v6 SPA Routing & RBAC Route Protection |
| | Axios | ✅ | Interceptors for JWT & Auto 401 handling |
| | React Hook Form + Zod | ✅ | Robust Schema Validation |
| | Lucide React | ✅ | Modern medical, navigation & action icons |
| | Recharts | ✅ | 7-day revenue/profit trend & payment pie charts |
| | Socket.IO Client | ✅ | Real-time live order notifications & GPS tracking |
| **Backend** | Node.js + Express.js | ✅ | Clean MVC Architecture |
| | REST APIs | ✅ | Full CRUD for medicines, batches, bills, reports |
| | JWT Authentication | ✅ | Bearer tokens with secure expiration |
| | Role-Based Access (RBAC)| ✅ | Owner/Admin, Pharmacist, Cashier, Delivery |
| | Socket.IO Server | ✅ | Real-time order broadcast, GPS telemetry & stock alerts |
| | Zod Validation | ✅ | API payload validation middleware |
| **Database** | MongoDB + Mongoose ODM | ✅ | MongoDB 7.0 with indexes, compound unique constraints |
| | Aggregation Pipelines | ✅ | Analytics for 7-day revenue, net profit & top medicines |
| **Real-time** | Socket.IO | ✅ | Live order sync, GPS rider radar, low-stock alerts |
| **Payments** | Razorpay Online | ✅ | Integrated with test fallback verification |
| **Notifications**| Nodemailer + WhatsApp | ✅ | Digital PDF invoices via email & click-to-WhatsApp |
| **Invoicing** | PDFKit | ✅ | Official GST Tax Invoices (Form 20B/21B compliant) |
| **Testing** | Vitest + Supertest | ✅ | Unit & integration tests for frontend and backend |
| **DevOps** | Docker + Compose + Nginx| ✅ | Full containerization setup |

---

## 🌟 Key Features

1. **High-Speed Counter POS Billing**:
   - Auto-complete search by brand, generic active ingredient, or barcode.
   - **FEFO (First Expiry First Out)** automatic batch selection to prevent expired drug loss.
   - Live tax computation: CGST (6%) + SGST (6%) for Maharashtra state GST compliance.
   - Immediate stock deduction and immutable ledger record (`StockMovement`).

2. **FDA Maharashtra Statutory Compliance (Schedule H Drugs)**:
   - Identifies Schedule H / Schedule X medicines.
   - Prompts and enforces mandatory Prescribing Doctor Name and MCI/MMC Medical Council Registration Number.
   - Dedicated Schedule H Prescription Register report ready for FDA inspection.

3. **Real-time Telemetry & Live Order Radar (Socket.IO)**:
   - Instant notification when a counter bill or online delivery is created.
   - Real-time GPS movement simulation along the Sangli - Miraj route.
   - Low-stock alerts broadcasted immediately to all logged-in staff.

4. **Digital & Thermal GST Tax Invoicing**:
   - Professional PDF Tax Invoices generated on the fly via `PDFKit`.
   - Store details: Form 20B (`MH-SAN-20B-11428`), Form 21B (`MH-SAN-21B-11429`), GSTIN (`27AABCU9603R1ZM`).
   - One-click PDF download, digital email dispatch via Nodemailer, and formatted WhatsApp bill link.

5. **Financial Analytics & Reporting**:
   - Recharts visual graphs distinguishing Sales Revenue from Gross Profit.
   - Top 10 dispensed medicines aggregation.
   - Monthly GST register exportable to CSV for Maharashtra commercial tax accountants.

---

## 🔑 Default Credentials for Demo

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Owner / Admin** | `admin@ganeshpharmacy.com` | `admin123` | Full access (Store settings, staff accounts, reports, sales) |
| **Registered Pharmacist** | `pharmacist@ganeshpharmacy.com` | `pharm123` | Catalog editing, batch adjustment, goods inward, POS |
| **Staff / Cashier** | `cashier@ganeshpharmacy.com` | `cash123` | Counter POS billing, invoice reprints, returns |
| **Delivery Partner** | `delivery@ganeshpharmacy.com` | `deliv123` | Live delivery tracking radar, GPS status dispatch |

*(Note: The login screen also features 1-click quick login buttons for effortless demonstrations!)*

---

## ⚡ Quick Start Guide (Windows)

### Option 1: One-Click Launch (Recommended)
Double-click `start-all.bat` in the project root:
- Automatically starts the Express + Socket.IO Backend on `http://localhost:5000`
- Automatically starts the React + Vite Frontend on `http://localhost:5173`
- Opens your browser directly to `http://localhost:5173`

### Option 2: Manual Start
```bash
# 1. Reset / Seed MongoDB with Sangli Maharashtra pharmacy data:
cd backend
node src/scripts/seed.js

# 2. Run backend in terminal 1:
npm run start
# Server listens on http://localhost:5000

# 3. Run frontend in terminal 2:
cd ../frontend
npm run dev
# Vite runs on http://localhost:5173
```

### Running Tests:
```bash
# Backend Vitest tests:
cd backend && npm test

# Frontend Vitest tests:
cd frontend && npm test
```

---

## 📋 Suggested Presentation Flow for "Sir"

1. **Login Page**:
   - Point out the Maharashtra FDA Drug License 20B/21B compliance badge.
   - Use the **1-Click Demo Login** button to enter as Owner/Admin.
2. **Dashboard**:
   - Highlight the **Today's Sales vs Today's Gross Profit** distinction.
   - Show the 7-day revenue trend bar chart rendered with **Recharts**.
   - Show the live **Socket.IO Sync Active** green indicator in the header.
3. **POS Counter Billing**:
   - Click "New Counter Bill (POS)" or navigate to `/pos`.
   - Search for `Dolo` or `Augmentin`. Notice how batches are automatically sorted in FEFO order.
   - Add `Augmentin 625 Duo` (Schedule H). Notice how the **Schedule H FDA Banner** immediately appears requiring Dr. Name and Council Reg. Number!
   - Fill in Doctor details, click "Complete Bill".
   - Demonstrate the generated invoice: Download the official **PDF Tax Invoice**, click **Email Bill**, or show the **WhatsApp** sharing link!
4. **Live Inventory & Delivery Radar**:
   - Go to `/inventory` to show that the stock quantity automatically decreased.
   - Go to `/delivery` and click **"Simulate Live Rider GPS Run"** to demonstrate real-time Socket.IO communication moving the rider along Miraj Road!
5. **Analytics & GST Reports**:
   - Show the **Schedule H Mandatory Rx Dispensation Register** and click **Export GST Register (CSV)**.
