# 📦 Campus Parcel Hub — Digital Security Command Center

A high-tech digital parcel management system for college security personnel and campus administrators.

---

## 🚀 Quick Start

### 1. Install and launch
From the project root or the `client` directory:
```bash
npm install
```
Then start the app from the project root:
```bash
npm run dev
```
You can also run `npm run dev` from `client`. On macOS/Linux, `./start.sh` starts the same services.

- **Frontend URL**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: `http://localhost:5001/api`
- **Database**: SQLite file database at `server/data/campus_hub.db`

---

---

## Parcel Modules

The interface is focused on three modules: **Add Parcel**, **Search & Pending**, and **History**. Navigation is available in the desktop sidebar and mobile bottom bar, with a high-contrast black-and-white design. History includes every parcel from intake onward, including parcels that have been delivered.

- **Add Parcel (Intake)**:
   - Form: Name, 10-digit phone, carrier app, rack allocation, optional tracking ID.
   - **Real-Time Duplicate Tracking ID Alert**: Warns security immediately if that tracking number is already held in pending.
   - Generates printable/copiable **Security Intake Pass / Barcode Slip**.
- **Search & Pending Parcels**:
   - Instant search without page reload (Name, Phone, Carrier, Rack, Tracking ID).
   - Rack details, days-waiting counter, and overdue indicators.
   - 1-click phone dial and WhatsApp notification shortcuts.
- **Parcel History**:
   - Automatically lists parcels from the moment they are added.
   - Delivered parcels remain in the history with their delivery status and timestamp.
   - Maintains `server/data/parcel_history.xlsx` and synchronizes it at startup and after intake, delivery, or deletion.
   - Download the current Excel history workbook from the History page.
   - Security staff can permanently delete delivered records; administrators can delete any parcel after confirmation. Deletion events remain in the audit log.
- **Verified Delivery Handover**:
   - Verification modal with recipient ID notes and confirmation check.
   - Status -> `Delivered`, saves timestamp & staff name, removed from pending list.
   - Delivered records remain in parcel history unless an administrator permanently deletes them.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS, Framer Motion, Lucide React, Canvas-Confetti, Web Audio API
- **Backend**: Node.js, Express, SQLite3, Bcrypt, JWT, ExcelJS
