# 🚛 Unnati Traders – Production ERP & POS Platform

> A production-grade Enterprise Resource Planning (ERP) and Point of Sale (POS) platform built for a wholesale Apollo Tyres distributor to digitize inventory, billing, customer ledgers, purchases, and multi-location stock management.


<p align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF)
![License](https://img.shields.io/badge/Status-Production-success)

</p>

---

# 📌 Overview

Unnati Traders is a **production-ready ERP & POS system** developed for a real Apollo Tyres distributor to replace manual bookkeeping and spreadsheet-based inventory management.

The platform streamlines:

- Inventory Management
- GST Billing
- Customer Credit Ledger (Khata)
- Purchase Management
- Stock Transfers
- Returns Handling
- Sales Analytics
- Multi-Location Warehousing

Unlike demo inventory projects, this application is actively designed around **real business workflows** including GST compliance, split payments, customer dues, and warehouse synchronization.

---

# ✨ Key Features

## 📦 Inventory Management

- Multi-location inventory
- Warehouse & retail shop support
- Live stock availability
- Low stock indicators
- Product search & filters
- Stock adjustment logs
- Monthly inventory snapshots

---

## 🧾 GST Billing & POS

- GST compliant invoices
- 28% HSN tax calculations
- Automated PDF invoice generation
- Multi-mode payments

Supports

- Cash
- UPI
- Card
- Credit
- Split Payments

---

## 👥 Customer Ledger (Khata)

Automatically maintains customer balances.

Tracks

- Previous dues
- New invoices
- Partial payments
- Outstanding balance
- Return credits

Supports Excel export for accounting.

---

## 🚚 Purchase Management

Manage supplier purchases including

- Stock inward
- Buying price
- Supplier records
- Purchase invoices
- Inventory updates

---

## 🔄 Stock Transfers

Transfer inventory between

- Warehouse
- Retail Shops

using atomic database transactions to maintain stock consistency.

---

## ↩️ Returns Management

Supports

- Customer Returns
- Good Condition Returns
- Defective Returns

Good products automatically return to inventory while defective products are logged separately.

---

## 📈 Analytics Dashboard

Interactive dashboards include

- Revenue
- Sales Trends
- Inventory Summary
- Customer Analytics

Built using **Recharts**.

---

## 🔒 Authentication & Security

- Clerk Authentication
- Role Based Access Control (RBAC)

Supported roles

- Admin
- Shopkeeper
- Dealer
- Visitor

Middleware protected routes ensure users only access authorized modules.

---

# 🏗️ System Architecture

```
                Clerk Authentication
                        │
                        ▼
                 Next.js App Router
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
 Inventory         Billing API      Customer Ledger
        │               │                │
        └───────────────┼────────────────┘
                        ▼
                  Prisma ORM
                        │
                        ▼
             PostgreSQL (Supabase)
```

---

# 🛠 Tech Stack

## Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Radix UI
- Lucide Icons

---

## Backend

- Next.js Route Handlers
- Server Actions
- Prisma ORM
- PostgreSQL

---

## Authentication

- Clerk
- RBAC
- Middleware Protection

---

## Charts

- Recharts

---

## Reports

- SheetJS (XLSX)

---

## Financial Calculations

- Decimal.js

---

## Deployment

- Vercel
- Vercel Analytics
- Speed Insights

---

# 🗄 Database Design

Core entities include

- Users
- Roles
- Customers
- Products
- Inventory
- Locations
- Purchases
- Purchase Items
- Invoices
- Invoice Items
- Payment Logs
- Return Logs
- Transfer Logs
- Stock Snapshots

Designed using **Prisma ORM** with normalized relational schema.

---

# 💡 Engineering Challenges Solved

## Financial Precision

JavaScript floating point calculations are unsuitable for financial applications.

Implemented **Decimal.js** to ensure accurate GST calculations and invoice totals.

---

## Inventory Consistency

Implemented database transactions using Prisma to guarantee stock consistency during

- Billing
- Stock Transfers
- Purchase Inward
- Returns

---

## Multi-location Architecture

Designed a normalized inventory model separating

Product Information

from

Location Inventory

allowing a single product to exist across multiple warehouses.

---

## Customer Ledger Engine

Implemented an automated ledger system that calculates

Outstanding Balance

=

Invoices

− Payments

− Returns

without manual bookkeeping.

---

# 📂 Project Structure

```
app/
components/
actions/
lib/
prisma/
public/
hooks/
types/
```

---

# 🚀 Running Locally

```bash
git clone https://github.com/rishabh-sikarwar/Unnati-Traders.git

cd Unnati-Traders

npm install
```

Create

```
.env
```

```
DATABASE_URL=

DIRECT_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

CLERK_SECRET_KEY=
```

Generate Prisma

```bash
npx prisma generate
```

Run migrations

```bash
npx prisma migrate dev
```

Run project

```bash
npm run dev
```

---

# 📸 Screenshots

## Dashboard

> <img width="1802" height="861" alt="image" src="https://github.com/user-attachments/assets/af10919f-fb5a-4511-8b5f-22c4fb512002" />



---

## Billing

> <img width="1896" height="902" alt="image" src="https://github.com/user-attachments/assets/6e384412-2ec0-4d02-b731-56f0be680fa8" />


---

## Customer Ledger

> <img width="1854" height="902" alt="image" src="https://github.com/user-attachments/assets/a4f394e0-5836-4a63-a7f2-b36f2a08eeca" />


---

## Inventory

> <img width="1876" height="908" alt="image" src="https://github.com/user-attachments/assets/9ee62c51-40b1-4f0a-96d8-64e18e6190f8" />


---

## Analytics

> <img width="1797" height="894" alt="image" src="https://github.com/user-attachments/assets/f603dd3b-89b5-49e9-9429-f5f77e9726ea" />


---

# 📈 Future Improvements

- Barcode Scanner
- WhatsApp Invoice Sharing
- SMS Notifications
- Offline Billing
- Mobile App
- AI Sales Prediction
- Supplier Portal
- Inventory Forecasting

---

# 👨‍💻 Author

**Rishabh Sikarwar**

B.Tech Electronics & Telecommunications

Full Stack Developer

LinkedIn:
https://linkedin.com/in/rishabhsikarwar

Portfolio:
https://portfolio-rishabh-sikarwars-projects.vercel.app/

GitHub:
https://github.com/rishabh-sikarwar

---

# ⭐ If you found this project interesting, consider giving it a star.
