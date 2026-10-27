# 🏫 Institutional School ERP — Production Deployment Guide

This guide covers deployment procedures for the **School ERP Management Platform** using **PostgreSQL** in production.

---

## 🏗️ 1. Architecture Overview

* **Frontend:** React 19 + Vite (built to static HTML/CSS/JS in `client/dist`)
* **Backend:** Node.js Express REST API (`server/`)
* **Database:** PostgreSQL 16+ (relational schema in `server/db/schema.sql`)
* **Authentication:** Stateless JWT with bcrypt password hashing

---

## 🚀 2. Deployment Options

### Option A: One-Command Docker Deployment (Recommended)

The platform includes a multi-stage `Dockerfile` and `docker-compose.yml` that orchestrates both PostgreSQL and the application container.

1. Ensure [Docker](https://www.docker.com/) and Docker Compose are installed.
2. In the project root, run:
   ```bash
   docker compose up -d --build
   ```
3. Docker will automatically:
   * Spin up an official **PostgreSQL 16** container with persistent volume storage (`postgres_data`).
   * Apply `server/db/schema.sql` to initialize all tables, indexes, and clean seeds.
   * Build the production React frontend bundle.
   * Start the Node.js production server on port **3001**.
4. Access the platform at: `http://localhost:3001`

---

### Option B: Cloud Deployment (Render / Railway / Supabase / Neon)

#### Step 1: Provision a PostgreSQL Database
* Create a free/production database on **Supabase**, **Neon**, **Render**, or **Railway**.
* Copy the connection string (`DATABASE_URL`). Example:
  ```text
  postgresql://postgres:yourpassword@db.region.supabase.co:5432/postgres?sslmode=require
  ```

#### Step 2: Configure Environment Variables
Set the following environment variables in your cloud hosting provider dashboard:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Listening port | `3001` (or provided by host) |
| `DATABASE_URL` | PostgreSQL connection URI | `postgresql://user:pass@host:5432/school_erp?sslmode=require` |
| `JWT_SECRET` | Secret key for signing session tokens | `your_random_64_character_hex_secret` |
| `CLIENT_URL` | Permitted frontend domain for CORS | `https://your-domain.com` (or leave blank if served together) |
| `ADMIN_USERNAME` | Initial Superadmin login username | `superadmin` |
| `ADMIN_PASSWORD` | Initial Superadmin secure password | `YourStrongAdminPassword2026!` |
| `ADMIN_EMAIL` | Administrator contact email | `admin@institution.edu` |

#### Step 3: Run Database Migrations
Run the migration script once against your PostgreSQL database:
```bash
npm run db:migrate
```
*Or directly via psql CLI:*
```bash
psql "$DATABASE_URL" -f server/db/schema.sql
```

#### Step 4: Build & Start
* **Build Command:** `npm run build`
* **Start Command:** `npm start`

---

### Option C: Traditional Linux / Ubuntu VPS (Nginx + PM2 + PostgreSQL)

```bash
# 1. Update system & install Node.js 20+ and PostgreSQL
sudo apt update && sudo apt install -y nodejs npm postgresql postgresql-contrib nginx

# 2. Configure PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE school_erp;"
sudo -u postgres psql -c "CREATE USER erpuser WITH ENCRYPTED PASSWORD 'StrongPasswordHere';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE school_erp TO erpuser;"

# 3. Clone and install project
git clone <your-repo> /var/www/school-erp
cd /var/www/school-erp
npm install
npm run build

# 4. Configure server/.env
cp server/.env.example server/.env
nano server/.env
# Set DATABASE_URL=postgresql://erpuser:StrongPasswordHere@localhost:5432/school_erp

# 5. Run migrations
npm run db:migrate

# 6. Start with PM2
sudo npm install -g pm2
pm2 start server/index.js --name "school-erp"
pm2 startup && pm2 save

# 7. Configure Nginx reverse proxy
# Forward traffic from port 80/443 to http://127.0.0.1:3001
```

---

## 🔐 3. Initial Administrator Access

All mock students, dummy parents, dummy teachers, and test accounts have been completely removed.

On initial deployment, use your configured root administrator credentials:

* **Login URL:** `/login`
* **Username:** `superadmin` *(or value of `ADMIN_USERNAME`)*
* **Password:** `Admin@Secure2026` *(or value of `ADMIN_PASSWORD`)*

> [!IMPORTANT]
> **Action Required After Initial Login:**
> Immediately navigate to **Profile (`/profile`)** -> **Change Security Password** to set your permanent private password.

---

## 🗄️ 4. Database Schema Structure

The PostgreSQL schema contains 35 relational tables:

1. **Identity & Auth:** `roles`, `users`, `school_admins`, `audit_logs`
2. **Academic Structure:** `academic_years`, `classes`, `sections`, `subjects`, `class_subjects`, `departments`
3. **Staff Directory:** `staff`, `teacher_assignments`, `staff_attendance`, `leave_types`, `leave_applications`
4. **Student Information:** `students`, `parents`, `student_parents`, `student_enrollments`, `student_attendance`
5. **Examinations & Grades:** `examination_types`, `examinations`, `examination_subjects`, `examination_marks`, `grading_rules`
6. **Finance & Fees:** `fee_categories`, `fee_structures`, `student_fees`, `fee_payments`
7. **Curriculum & Materials:** `timetables`, `assignments`, `assignment_submissions`, `study_materials`
8. **Communication:** `notifications`, `user_notifications`
