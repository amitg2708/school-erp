# 🏫 Enterprise Institutional School ERP Platform

A modern, full-stack, enterprise-grade School ERP and Campus Management Platform built with **React 19**, **Node.js / Express**, and **PostgreSQL 16**.

---

## ✨ Key Features & Modules

### 1. 🎛️ Multi-Role Institutional Portals
* **Root Superadmin:** Complete system control, tenant settings, institutional audits, and school administrators.
* **School Administrators:** Daily school operations, faculty assignments, fee collections, student records, and timetable.
* **Faculty / Teachers:** Grade entries, assignments, notices, and roll call.
* **Students & Parents:** Academic progress reports, attendance history, and fee receipts.

### 2. 🚌 Interactive Bus Seat Booking Attendance System
* **Bus Deck Layout (2 × 2 with Aisle):** Visual passenger deck with Left Window, Left Aisle, Walkway, Right Aisle, and Right Window seats.
* **redBus-Style Legend & Meter:** Live occupancy rate percentage and color-coded status badges for **Present (Green)**, **Absent (Red)**, **Late (Yellow)**, **Half Day (Blue)**, and **Available (Unmarked)**.
* **1-Click Interactive Toggling:** Click any seat to cycle status or use micro-dock buttons (`P`, `A`, `L`, `H`).
* **⚡ Fast Absent Mode:** Roll-call tool allowing teachers to mark absent students in seconds.
* **Classroom Desk Grid & Classic List Modes:** Easily switchable views.

### 3. 👥 Indian Faculty & Student Management
* Pre-seeded with authentic Indian faculty (Principals, Vice Principals, PGT, TGT, PRT, Lab Superintendents, Bursars).
* Pre-seeded student roster across CBSE Classes with parent contacts, blood groups, addresses, and admission numbers.

### 4. 📝 Examination, Grading & Fee Systems
* **Examinations:** CBSE midterm exam schedules, marks ledger, and percentage calculations.
* **Fee Management:** Term fee structures, receipts in INR (₹), and payment status tracking.
* **Notices & Bulletins:** Official school circulars with categorization (Academic, Exam, Fee, General).

### 5. 🎨 4 Enterprise Color Themes
* **Executive Indigo** (Default high-tech modern enterprise)
* **Prestige Navy** (Academic Ivy / Oxford Blue)
* **Emerald Collegiate** (Botanical Ivy League)
* **Obsidian Dark** (Sleek executive dark mode)

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Lucide Icons, Recharts, React Hot Toast |
| **Styling** | Modern Vanilla CSS Design System with CSS Custom Properties |
| **Backend** | Node.js, Express REST API, Stateless JWT, bcrypt |
| **Database** | PostgreSQL 16 (Primary) with SQLite local fallback support |
| **DevOps** | Multi-Stage Dockerfile, Docker Compose |

---

## 🚀 Quick Start (Local Docker)

The easiest way to run the entire platform with PostgreSQL is via Docker Compose:

```bash
# 1. Clone the repository
git clone https://github.com/amitg2708/school-erp.git
cd school-erp

# 2. Launch PostgreSQL and School ERP
docker compose up -d --build
```

Access the application at `http://localhost:3001`.

---

## 💻 Manual Setup & Local Development

### Prerequisites
* Node.js 20+
* PostgreSQL 14+ (or SQLite)

### 1. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment
Create `server/.env` based on `server/.env.example`:
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/school_erp
```

### 3. Run Database Migrations & Seed
```bash
cd server
node db/migrate.js
node db/seedIndianData.js
```

### 4. Start Application
```bash
# In server directory:
node index.js

# In client directory (in another terminal):
npm run dev
```

---

## 🔐 Default Institutional Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Root Superadmin** | `superadmin` | `Admin@Secure2026` |
| **School Admin (Principal)** | `admin.rajeshwar` | `Admin@Secure2026` |
| **School Admin (Vice Principal)** | `admin.meenakshi` | `Admin@Secure2026` |
| **School Admin (Dean)** | `admin.alok` | `Admin@Secure2026` |

---

## 📦 Deployment Guide

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions for deploying to:
* **Docker / VPS** (DigitalOcean, AWS EC2, Linode)
* **PaaS & Containers** (Render, Railway, Fly.io)
* **Managed Database** (Supabase, Neon, AWS RDS)

---

## 📄 License
ISC License &copy; Institutional School ERP System.
