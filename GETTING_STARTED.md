# Uniform – Local Setup Guide (Backend + Frontend + Seeding)

This guide walks you step‑by‑step from cloning the repo to running the app locally, including database setup and seeding Bangladeshi universities and units.

## Prerequisites
- Node.js: v18 or v20 recommended (LTS)
- npm: comes with Node (use npm 9+)
- PostgreSQL database:
  - Option A: Use your own local Postgres
  - Option B: Use a hosted Postgres (the repo already includes a Neon connection in `backend/.env`)

## 1) Clone the repository
```bash
# Using HTTPS
git clone https://github.com/<your-org-or-user>/Uniform.git
cd Uniform
```

## 2) Install dependencies
- Backend
```bash
cd backend
npm install
```
- Frontend
```bash
cd ../uniform-frontend
npm install
```

## 3) Configure environment variables
### Backend (`backend/.env`)
Create or update `backend/.env` with at least:
```env
PORT=5000
# Generate a strong random secret (example below)
JWT_SECRET="<your-random-secret>"
# Choose ONE database URL:
# 1) Hosted (already present in repo example)
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require&channel_binding=require"
# 2) Local Postgres example
# DATABASE_URL="postgresql://postgres:<password>@localhost:5432/uniform?schema=public"
```
Generate a random JWT secret (any of the following):
```bash
# Node
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

### Frontend (`uniform-frontend/.env`)
Create `uniform-frontend/.env` so the UI knows how to reach the backend API:
```env
VITE_API_URL="http://localhost:5000/api"
```
Adjust the URL if your backend runs on a different host/port.

## 4) Prepare the database schema
From the `backend` directory, apply Prisma schema to your database.
- If you are using migrations (recommended for prod/hosted DB):
```bash
cd backend
npx prisma migrate deploy
```
- For quick local dev (no migrations), you can push the schema directly:
```bash
npx prisma db push
```
If you see client generation issues, run:
```bash
npx prisma generate
```

Optional: open Prisma Studio to visually inspect tables:
```bash
npx prisma studio
```

## 5) Seed essential data
Two seed scripts are provided under `backend/routes/`.

- Seed system administrators:
```bash
cd backend
node routes/seed_system_admin.js
```
  - Seeds several `SYSTEM_ADMIN` users with emails/passwords from the script.

- Seed Bangladeshi universities, units, and requirements:
```bash
node routes/seed_universities.js
```
  - Inserts/updates 20 institutions (public/private; general/engineering)
  - Creates typical unit structures (A/B/C/D/E or Schools)
  - Adds multiple `UnitRequirement` rows per unit reflecting Bangladesh admission patterns (Science/Arts/Commerce combinations with GPA + passing year windows)
  - Safe to rerun: uses upserts and `skipDuplicates` for requirements

Tip: If you are reseeding and want a clean slate for institutions/units only, you can manually truncate those tables in your DB first. Otherwise, just rerun the seed — it is designed to be idempotent.

## 6) Run the backend
From `backend`:
```bash
# Development (with auto-restart)
npm run server
# or Production-style
npm start
```
The backend should listen on `http://localhost:5000` (or `PORT` in your `.env`).

## 7) Run the frontend
In a separate terminal from `uniform-frontend`:
```bash
npm run dev
```
Vite will start on `http://localhost:5173` by default. Ensure `VITE_API_URL` points to your backend (default `http://localhost:5000/api`).

## 8) Quick validation checklist
- Backend
  - `npx prisma studio` shows `Institution`, `Unit`, and `UnitRequirement` with data after seeding
  - Optionally test endpoints from `uniform-frontend/testing.md` against `http://localhost:5000`
- Frontend
  - App loads at `http://localhost:5173` and can fetch institutions

## Troubleshooting
- Prisma Client not found or not generated:
  - Run `npx prisma generate` inside `backend`
- Database connection errors:
  - Verify `DATABASE_URL` in `backend/.env`
  - For hosted DBs (e.g., Neon), ensure `sslmode=require` is present
  - For local Postgres, confirm service is running and credentials are correct
- Ports in use:
  - Change `PORT` in `backend/.env` or Vite’s port using `--port` when running `npm run dev`
- CORS issues:
  - Ensure frontend `VITE_API_URL` matches your backend origin/port

## What was seeded (summary)
- System admins: `backend/routes/seed_system_admin.js`
- 20 Bangladeshi institutions with units and eligibility rules: `backend/routes/seed_universities.js`
  - Science-only, Arts-focused, Business-focused, All-stream, and Fine Arts patterns
  - Passing year windows aligned with typical admission cycles (HSC current/previous year; SSC 2–3 years prior)

## Next steps
- Create institution admins and manage institutions/units via your admin UI
- Adjust seed data (deadlines/exam dates/GPAs) in `backend/routes/seed_universities.js` to suit your current admission cycle
- Deploy backend with your preferred platform and point the frontend `VITE_API_URL` to the deployed API

