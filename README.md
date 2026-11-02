# CollectIQ — AI-Powered Field Collections Management Platform

**Production-Quality Fintech Platform for Non-Banking Financial Companies (NBFCs)**  
*Engineered for Company A, an RBI-registered NBFC based in Indore, India lending to small manufacturers & traders.*

[![Tests](https://img.shields.io/badge/tests-18%20passed-15803D.svg)](#automated-testing)
[![Next.js](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-176B4D.svg)](https://www.prisma.io)
[![Offline](https://img.shields.io/badge/IndexedDB-Offline%20First-orange.svg)](#offline-resilience)

---

## 📌 Context & Problem Statement

Company A is an RBI-registered NBFC headquartered in Indore, MP, financing micro and small enterprises across industrial areas (Pithampur, Sanwer Road, Palasia, Vijay Nagar, Rajwada). 

Their legacy collections workflow suffered from severe operational friction:
- **Daily overdue loan lists** exported manually to unwieldy Excel sheets.
- **Field assignments** haphazardly shared over unencrypted WhatsApp groups.
- **Collection outcomes** handwritten in paper diaries.
- **Promise-to-pay commitments** tracked manually, leading to high default slip-throughs.
- **Head office** spending days reconstructing weekly roll-rate and migration reports.

**CollectIQ** replaces this fragmented pipeline with a centralized, mobile-first, and regulatory-compliant operations system.

---

## 🚀 Key Capabilities

### 1. 📱 Field Collection Officer App (Mobile-First)
- **Daily Prioritised Visit Route:** Replaces paper lists with dynamic, AI-prioritised borrower cards.
- **Explainable 0–100 Priority Score:** Clearly displays the score, category (Critical, High, Medium, Low), and the **top 3 mathematical reasons** explaining why each borrower matters today.
- **3-Tap Outcome Logging:** Log `Paid`, `Promise to Pay`, `Not Reachable`, or `Dispute` in ~3 taps with automatic synthetic/device GPS and audit trails.
- **IndexedDB Offline Resilience:** Offline caching of assigned loans and a local queue (`syncQueue`) with idempotency keys that auto-syncs when connectivity returns.
- **RBI Contact Window Restriction:** Strict client and server validation enforcing the **8:00 AM – 7:00 PM IST** contact boundary under RBI Fair Practices guidelines. Includes a demo time-travel simulation toggle for evaluations.
- **AI-Assisted Reminder Drafter:** Approved polite reminder templates in **Hindi** and **English** with an anti-coercion safety filter preventing threatening language.

### 2. 💻 Branch Manager Operations Terminal (Desktop)
- **Live Portfolio Roll-Rate Analytics:** Calculates real migrations from 1–30 DPD to 31–60 DPD (SMA-1) directly from live database records (no hardcoded metrics).
- **Drag-and-Drop CSV Import:** Validates CBS exports, identifies duplicate loan IDs, checks required headers, and presents an interactive dry-run preview.
- **Intelligent Routing:** Auto-assigns loans to field officers based on branch pincode boundaries and workload balancing.
- **Supervisory AI Overrides:** Managers can override AI priorities with mandatory audit justification notes.
- **AI Model Backtesting Report:** Evaluates priority score deciles against empirical cure and broken promise rates, with explicit limited-evidence warnings for early pilots.

---

## 🛠️ Stack & Architecture

- **Architecture:** Modular Monolith
- **Framework:** Next.js 14 (App Router) & TypeScript
- **Styling & Tokens:** Tailwind CSS (Strict palette: Warm off-white `#F8F8F5`, Charcoal `#171918`, Forest green `#176B4D`, Muted stone `#E8E9E3`, 1px borders `#E2E4DE`)
- **Animation & Polish:** Framer Motion, GSAP, and Lenis smooth scrolling
- **Database & ORM:** PostgreSQL / SQLite with Prisma ORM
- **Offline Persistence:** IndexedDB via `idb` with cryptographic idempotency keys
- **Data Visualizations:** Recharts for roll-rate trends, DPD distributions, and outcome breakdowns
- **Validation:** Zod schemas for CSV rows, outcomes, and reminders
- **Testing:** Vitest suite with 18 unit, integration, and E2E tests

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Push Prisma database schema
pnpm exec prisma db push
pnpm exec prisma generate

# 3. Seed synthetic Indore NBFC dataset
pnpm run prisma:seed

# 4. Run automated test suite
pnpm test

# 5. Start development server
pnpm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🔑 Demo Access Accounts

| Role | Official Email | Demo Password | Branch / Region |
|---|---|---|---|
| **Field Collection Officer** | `rahul.chouhan@collectiq.in` | `Password@123` | Indore Palasia Branch |
| **Field Collection Officer** | `neha.solanki@collectiq.in` | `Password@123` | Indore Vijay Nagar Retail |
| **Field Collection Officer** | `imran.qureshi@collectiq.in` | `Password@123` | Pithampur Industrial Corridor |
| **Branch Operations Manager** | `anand.verma@collectiq.in` | `Password@123` | Regional Cluster (Indore) |

*(Quick one-click login buttons are also provided on the sign-in screen at `/auth/sign-in`)*

---

## 🧪 Automated Testing

Run the Vitest test suite:
```bash
pnpm test
```

Test coverage includes:
- `tests/priority-scoring.test.ts`: Validates 0–100 scoring algorithm, Company D (LN-11930) benchmark score (86/100), top 3 reasons, and currency formatting.
- `tests/roll-rate.test.ts`: Verifies DPD bucket categorization (1-30, 31-60, 61-90, 90+) and exact roll-rate formulas.
- `tests/contact-window.test.ts`: Tests 8 AM – 7 PM IST contact boundaries and demo simulation bypass.
- `tests/csv-import.test.ts`: Tests CSV validation, header normalization, duplicate detection, and intelligent pincode/workload routing.
- `tests/reminder-safety.test.ts`: Tests English & Hindi templates and anti-coercion word filters.
- `tests/e2e-workflow.test.ts`: Tests end-to-end collection logging, offline sync idempotency deduplication, and role access scoping.

---

## 📄 Documentation Deliverables

- **Technical Design Document (Markdown):** [`docs/TECHNICAL_DESIGN_DOCUMENT.md`](docs/TECHNICAL_DESIGN_DOCUMENT.md)
- **Technical Design Document (Word .docx):** [`docs/TECHNICAL_DESIGN_DOCUMENT.docx`](docs/TECHNICAL_DESIGN_DOCUMENT.docx)
- **Technical Design Document (Printable HTML):** [`docs/TECHNICAL_DESIGN_DOCUMENT.html`](docs/TECHNICAL_DESIGN_DOCUMENT.html)
- **Deployment & Operations Guide:** [`deployment.md`](deployment.md)

