# 🎓 Project Presentation & Live Demonstration Handbook
### **Shree Ganesh Medical & General Stores Management System**
**Tech Stack**: MongoDB Atlas, Express.js, React.js (Vite), Node.js, Socket.IO, Tailwind CSS  
**Target Domain**: Retail Community Pharmacy & Delivery Logistics (Sangli, Maharashtra)

---

## ⏱️ 1. The 30-Second Elevator Pitch (For the Team Leader to Speak)

> *"Good morning/afternoon, Sir. Our project is a cloud-deployed, full-stack Medical Store Management & Real-time Delivery System built specifically for Indian retail pharmacies, modeled after **Shree Ganesh Medical & General Stores** in Sangli.*
>
> *Unlike generic retail billing apps, community pharmacies face strict statutory regulations under the **Drugs & Cosmetics Act** and **FDA Maharashtra** rules—such as mandatory Schedule H prescription recording, batch-level FEFO (First-Expiry-First-Out) dispensing, and dual GST tax calculations (5% and 12%).*
>
> *We have integrated an end-to-end operational pipeline: a fast, touch-friendly POS counter for cashiers, real-time WebSocket delivery dispatch to an on-field mobile Rider Portal with Google Maps navigation, and an executive analytics dashboard tracking COGS and Gross Profit for the store owner."*

---

## 🏛️ 2. High-Level Technical Architecture

```
                               ┌──────────────────────────────────────────────────────────┐
                               │                    CLIENT DEVICES                        │
                               │                                                          │
                               │   Store Counter Laptop           Rider Mobile Smartphone │
                               │   (Admin / Cashier POS)            (Rider Portal View)   │
                               └──────────────┬─────────────────────────────┬─────────────┘
                                              │                             │
                                        HTTPS │                             │ WSS / HTTPS
                                              ▼                             ▼
                               ┌──────────────────────────────────────────────────────────┐
                               │                 VERCEL EDGE NETWORK                      │
                               │             (React 18 + Vite SPA Client)                 │
                               │     Tailwind CSS • Lucide Icons • Recharts Analytics     │
                               └──────────────────────────────┬───────────────────────────┘
                                                              │
                                                        REST API / Socket.IO
                                                              ▼
                               ┌──────────────────────────────────────────────────────────┐
                               │                 RENDER CLOUD PLATFORM                    │
                               │                (Node.js + Express.js)                    │
                               │   • JWT Auth + In-Memory Rate Limiting                   │
                               │   • Role-Based Access Control (4 Roles)                  │
                               │   • Socket.IO Real-time Bi-directional Dispatch Engine   │
                               │   • PDFKit GST Tax Invoice Engine                        │
                               └──────────────────────────────┬───────────────────────────┘
                                                              │
                                                        Mongoose ODM (TLS)
                                                              ▼
                               ┌──────────────────────────────────────────────────────────┐
                               │                 MONGODB ATLAS (M0 CLOUD)                 │
                               │                AWS Mumbai (ap-south-1)                   │
                               │   • Users • Medicines • Batches (FEFO Indexed)           │
                               │   • Sales • Purchases • Stock Movements • Settings       │
                               └──────────────────────────────────────────────────────────┘
```

---

## 🔑 3. Live Demo Accounts & Roles

Keep these demo credentials handy. Each role has strictly enforced server-side access boundaries:

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Store Owner / Admin** | `admin@ganeshpharmacy.com` | `admin123` | Full access: Gross profit, COGS, inventory, purchases, settings, staff audit. |
| **POS Cashier** | `cashier@ganeshpharmacy.com` | `cash123` | Fast touch POS, Home Delivery dispatch, Tax Invoice reprint. |
| **Pharmacist** | `pharmacist@ganeshpharmacy.com` | `pharm123` | Medicine catalogue, batch entries, supplier purchase orders, Schedule H compliance. |
| **Delivery Rider** | `delivery@ganeshpharmacy.com` | `deliv123` | **Locked into Mobile Rider Portal**: GPS route navigation, 1-tap Call/WhatsApp, COD tally. |

---

## 🎬 4. Step-by-Step Live Walkthrough Script (5-7 Minutes)

Follow this sequence during your presentation for maximum impact:

### Step 4.1: The Executive Dashboard (Login as Admin)
* **Login**: `admin@ganeshpharmacy.com` / `admin123`
* **What to Show**:
  1. **Telemetry Cards**: Point out *Today's Revenue*, *Net Profit*, *Total Orders*, and *Low Stock / Near-Expiry alerts*.
  2. **Financial Aggregations**: Show the **Sales vs. Cost of Goods Sold (COGS)** bar chart and **Revenue by Category** pie chart.
  3. **Statutory Banner**: Highlight the legal compliance header displaying FDA Maharashtra Drug License Nos. (`MH-SAN-20B-11428`, `MH-SAN-21B-11429`) and GSTIN (`27AABCU9603R1ZM`).
* **What to Tell Sir**:
  > *"Sir, the dashboard computes profit dynamically using MongoDB aggregation pipelines rather than simple flat totals, ensuring real-time gross margin tracking across thousands of transactions."*

---

### Step 4.2: Fast POS Counter Checkout (Login as Cashier)
* **Login**: `cashier@ganeshpharmacy.com` / `cash123` ➔ Click **Point of Sale**.
* **What to Show**:
  1. **Quick-Tap OTC Tiles**: Tap *Paracetamol 650mg*, *Vicks Vaporub*, or *ORS Sachet*. Show how they instantly add to the bill.
  2. **Category Filter Pills**: Click pills (`Antibiotics`, `Analgesic`, `First Aid`) to demonstrate instant counter filtering.
  3. **FEFO Batch Automation**: Point out that the system automatically selects the batch with the **earliest expiry date** (`Aug 2026` before `Nov 2026`), preventing expired stock loss.
  4. **Schedule H Prescription Enforcement**:
     - Search and add an antibiotic (e.g. *Augmentin 625 Duo* or *Azithromycin 500mg*).
     - Notice the red **"Schedule H Drug"** badge appears.
     - Show that the checkout form enforces **Doctor Name** (e.g., *Dr. Deshmukh*) and **Medical Council Registration Number** (e.g., *MCI-48291*).
* **What to Tell Sir**:
  > *"Under the Drugs and Cosmetics Act, dispensing Schedule H antibiotics without recording the prescribing doctor's registration number is illegal. Our system makes this an active validation rule at the POS counter."*

---

### Step 4.3: Counter Takeaway vs. Home Delivery Toggle (The "Wow" Factor!)
* **What to Show**:
  1. On the POS checkout panel, toggle from **Store Counter (Takeaway)** to **Home Delivery (Rider Dispatch)**.
  2. Notice the delivery form fields appear:
     - Customer Name: *Vikram Joshi*
     - 10-digit Phone: *9823011223*
     - Delivery Address: *Flat 302, Sai Heights, Gaonbhag, Sangli*
  3. Select Payment: **Cash on Delivery (COD)** or **UPI Soundbox**.
  4. Click **Complete Checkout & Dispatch**.
  5. The sale completes, inventory decrements instantly, and a delivery assignment event is broadcast via WebSockets.

---

### Step 4.4: The Dedicated Rider Mobile Portal (Real-Time Handover)
* **Demonstration Tip**: Open an Incognito window or use Chrome DevTools in Mobile Device View (iPhone / Pixel), OR open the live Vercel URL on an actual smartphone!
* **Login**: `delivery@ganeshpharmacy.com` / `deliv123`
* **What to Show**:
  1. **Automatic Portal Lock**: Notice that the delivery partner is strictly restricted to `RiderPortal` and cannot access store finances or inventory.
  2. **Active Order Card**: The newly dispatched order for *Vikram Joshi* appears instantly without refreshing the page.
  3. **1-Tap Google Maps Navigation**: Click the **"Navigate (Google Maps)"** button — it opens the exact Sangli address coordinates ready for turn-by-turn navigation.
  4. **1-Tap Call & WhatsApp**: Point out the direct `tel:` and `wa.me` links for contacting the customer.
  5. **COD Cash Collection Tally**: Show the live **"Cash to Handover at Store"** counter at the top. Click **"Mark as Delivered"** — the COD amount adds to the rider's pending settlement tally.
* **What to Tell Sir**:
  > *"Sir, this eliminates physical delivery registers and verbal instructions. The rider gets live orders, directions, and direct communication shortcuts, while the cashier knows exactly how much cash the rider must return."*

---

### Step 4.5: GST Tax Invoice Generation & Ledger
* Switch back to the Admin/Cashier window ➔ Navigate to **Sales Ledger**.
* Find the newly completed invoice (`SGM-26-...`).
* Click **Download PDF**:
  - Show the clean tax invoice containing:
    - Shop Header with Drug License 20B/21B and Pharmacist credentials.
    - Prescribing Doctor info.
    - HSN Codes, Batch Numbers, and Expiry Dates per item.
    - Statutory GST split into **CGST** and **SGST** columns (6% + 6% for 12% items, 2.5% + 2.5% for 5% items).

---

## 🛡️ 5. Viva / Defense Sheet: Anticipated Questions & Winning Answers

### Q1: *"Why did you use MongoDB instead of MySQL/PostgreSQL?"*
> **Answer**: *"Sir, pharmaceutical products have semi-structured attributes: some are Schedule H, some are Schedule X narcotics, some are OTC, and batch counts fluctuate per medicine. MongoDB’s document model allowed us to store multiple active batches (with varying manufacture dates, expiry dates, purchase costs, and MRPs) embedded or referenced directly within medicines, and use native Aggregation Pipelines to compute real-time COGS and gross profits across historical sales without heavy multi-table SQL joins."*

---

### Q2: *"How does the system ensure expired medicines are never sold to patients?"*
> **Answer**: *"We implemented the **FEFO (First-Expiry-First-Out)** algorithm. In `saleController.js`, when an item is added to the bill, our query sorts the active batches by `expiryDate: 1`. It automatically selects units from the earliest-expiring batch first. If a batch is within 30 days of expiry, the cashier receives a warning, and expired batches are excluded from active sales entirely."*

---

### Q3: *"How does real-time communication work between the POS cashier and the rider?"*
> **Answer**: *"We integrated **Socket.IO** over WebSockets on top of our Express HTTP server. When the cashier clicks 'Dispatch', the server emits a `delivery:new` event to the `delivery-riders` room. Connected rider mobile clients receive the payload instantaneously and update their React state without needing to poll or reload the browser."*

---

### Q4: *"What security measures have you implemented?"*
> **Answer**: *"We conducted a comprehensive security audit before live deployment:
> 1. **Brute Force Defense**: In-memory IP-based rate limiting on `/api/auth/login` (max 15 attempts per 15 minutes).
> 2. **NoSQL Injection Guard**: Strict string type-checking on credentials to prevent operator bypass attacks (e.g. `{$ne: null}`).
> 3. **Role-Based Access Control (RBAC)**: Server-side middleware verifying JWT signatures and role claims on every private endpoint.
> 4. **Production Hardening**: Stack traces and internal error dumps are masked in production, and CORS origin whitelisting is enforced."*

---

### Q5: *"What if the internet goes down at the physical pharmacy counter?"*
> **Answer**: *"The system was engineered to run seamlessly in both environments: it is deployed live on cloud (Vercel + Render + MongoDB Atlas), but we also built self-contained Windows launch scripts (`start-all.bat` and `setup-and-run.bat`) that run locally on an offline machine using local MongoDB on port 27017."*

---

## 🌟 6. Future Scope (What to mention at the end to show vision)

1. **Barcode / 2D DataMatrix Scanner Integration**: For millisecond product lookup using physical handheld USB/Bluetooth scanners.
2. **Customer Khata (Credit Ledger)**: Tracking monthly credit accounts for neighborhood regular patients.
3. **Automated Expiry Return Challan (Debit Notes)**: 1-click batch returns to pharmaceutical C&F distributors for credit refunds.
4. **Chronic Patient WhatsApp Refill Reminders**: Automatic alerts for patients on 30-day recurring BP and Diabetes prescriptions.
