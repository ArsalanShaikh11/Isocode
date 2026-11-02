# CollectIQ — Deployment & Operations Guide

This guide details local development setup, database initialization, synthetic data seeding, and production cloud deployment for **CollectIQ**.

---

## 1. Environment Variables

Store environment configurations in `.env` (or configure them in your hosting provider's dashboard). **No secrets are hardcoded in the codebase.**

```env
# Database connection string
# For local development: file:./dev.db
# For PostgreSQL production: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
DATABASE_URL=

# Cryptographic secret for signing session authentication cookies
SESSION_SECRET=

# Public application base URL
NEXT_PUBLIC_APP_URL=
```

---

## 2. Local Setup & Execution

### Prerequisites
- Node.js `v18.18+` or `v20+` / `v22+`
- pnpm `v9+` or `v10+` (or npm / yarn)

### Step-by-Step Installation
```bash
# 1. Clone repository and navigate to directory
git clone https://github.com/company-a-nbfc/collectiq.git
cd collectiq

# 2. Install dependencies
pnpm install

# 3. Initialize database schema and generate Prisma client
pnpm exec prisma db push
pnpm exec prisma generate

# 4. Seed database with synthetic Indore NBFC dataset
pnpm run prisma:seed

# 5. Run automated test suites (Vitest unit, integration & E2E tests)
pnpm test

# 6. Start local development server
pnpm run dev
```

Open your browser at `http://localhost:3000`.

---

## 3. Demo Credentials

Seed data creates demo accounts for both core organizational roles:

| Role | Name | Official Email | Demo Password | Branch Scope |
|---|---|---|---|---|
| **Field Collection Officer** | Rahul Chouhan | `rahul.chouhan@collectiq.in` | `Password@123` | Indore Palasia Branch |
| **Field Collection Officer** | Neha Solanki | `neha.solanki@collectiq.in` | `Password@123` | Indore Vijay Nagar Retail |
| **Field Collection Officer** | Imran Qureshi | `imran.qureshi@collectiq.in` | `Password@123` | Pithampur Industrial Corridor |
| **Branch Operations Manager** | Anand Verma | `anand.verma@collectiq.in` | `Password@123` | Regional Cluster (Indore) |

> *Note: The Sign-in page (`/auth/sign-in`) also features quick one-click demo login buttons for both Rahul Chouhan and Anand Verma.*

---

## 4. Production Deployment

### Option A: Vercel Deployment (Recommended for Next.js App Router)
1. Push your repository to GitHub.
2. In Vercel, click **Add New Project** and select the repository.
3. Configure Environment Variables in the project settings:
   - `DATABASE_URL` (Pointing to Supabase, Neon, or Railway PostgreSQL)
   - `SESSION_SECRET` (A strong random string)
   - `NEXT_PUBLIC_APP_URL` (Your production Vercel domain)
4. Set Build Command: `pnpm exec prisma generate && pnpm run build`
5. Click **Deploy**.

### Option B: Docker Container Deployment
A standard production container Dockerfile:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec prisma generate
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## 5. Verification Checklist

- [x] All 18 automated unit and integration tests passing (`pnpm test`).
- [x] Zero TypeScript compilation warnings or errors (`pnpm run build`).
- [x] Offline IndexedDB cache & sync queue active on Android Chrome.
- [x] Contact time restriction verified for Asia/Kolkata (8 AM – 7 PM IST).
- [x] Explainable AI scoring math verified for LN-11930 (Score: 86/100).

