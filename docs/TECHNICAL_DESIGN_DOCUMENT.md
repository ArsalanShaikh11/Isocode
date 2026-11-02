# CollectIQ — Technical Design Document (TDD)
**AI-Assisted Field Collections Management Platform for NBFCs**  
*Client: Company A (RBI-Registered NBFC, Indore, Madhya Pradesh)*  
*Document Version: 1.0.0 (Production Release)*  
*Date: November 2026*

---

## Executive Summary & Metadata

- **Product Name:** CollectIQ
- **Target Organization:** Company A — RBI-Registered NBFC based in Indore, MP (Lending to MSME packaging units, fertiliser shops, commercial printing presses, textile traders, and auto-part fabricators).
- **GitHub Repository URL:** `https://github.com/company-a-nbfc/collectiq`
- **Live Application URL:** `https://collectiq-indore.vercel.app` (Local Development Port: `http://localhost:3000`)
- **System Classification:** Operational Fintech SaaS (Modular Monolith)

---

## 1. System Architecture

CollectIQ replaces Company A's fragmented legacy workflow (daily overdue Excel exports, WhatsApp loan assignments, paper notebooks, and manual head-office compilation) with an integrated modular monolith architecture.

### Architectural Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER                                    │
│                                                                             │
│   Field Collection Officer App (Mobile-First)   Branch Manager Terminal     │
│   - Low-end Android PWA (One-handed 48px UI)     - Desktop Dashboard        │
│   - IndexedDB Offline Sync Queue (idb)          - Recharts Analytics        │
│   - RBI 8 AM–7 PM IST Contact Window Guard      - Drag-and-Drop CSV Import  │
│   - AI Reminder Drafter (English & Hindi)       - AI Priority Overrides     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / JSON / Cookies
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    NEXT.JS APPLICATION LAYER (App Router)                   │
│                                                                             │
│  /app/officer/*         /app/manager/*          /app/api/*                  │
│  - Priority List        - Roll-Rate Analytics   - /auth/login, /auth/me     │
│  - 3-Tap Outcome Logger - CSV Import & Pincodes - /officer/loans, /outcomes │
│  - Promise Tracker      - Activity Log & Geotag - /manager/dashboard        │
│  - AI Reminder Drafter  - Model Backtesting     - /manager/import, /sync    │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                           DOMAIN CORE MODULES                           │ │
│ │  - Explainable AI Prioritisation Engine (0–100 Scoring Math)            │ │
│ │  - RBI Fair Practices Policy Filter (Anti-Coercion Language Guard)      │ │
│ │  - Roll-Rate Velocity Engine (SMA-0 to SMA-1 Migration Tracker)         │ │
│ │  - Intelligent Pincode & Workload Assignment Router                     │ │
│ │  - Offline Sync Deduplication Engine (Idempotency Key Guard)            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Prisma ORM (Type-Safe Client)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                            DATA PERSISTENCE LAYER                           │
│                                                                             │
│   SQLite (Zero-Config Portable Local Run) / PostgreSQL (Cloud Production)  │
│   - Users & Branch Hierarchy        - CollectionOutcomes (Audit Trail)      │
│   - Borrowers & Loans Portfolio     - Historical RollRate Snapshots         │
│   - PromisesToPay (Commitments)     - AI Reminder Logs                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Tenets
1. **Zero Unnecessary Microservices:** A single Next.js modular monolith prevents distributed transaction failures and latency overhead in rural/industrial network zones.
2. **Offline-First Resilience:** Field officers in low-connectivity areas (Pithampur industrial sheds, Sanwer Road) can continue logging outcomes without network interruption.
3. **Regulatory Safety by Design:** Hard validation on RBI Fair Practices Code boundaries (strict 8 AM – 7 PM IST contact restriction and automated anti-coercion language filters).

---

## 2. Data Model & Entity Relationship

The database schema is managed via Prisma ORM and supports strict relational integrity.

```prisma
datasource db {
  provider = "sqlite" // Easily toggled to "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  role         String   // "OFFICER" | "MANAGER"
  phone        String
  branchId     String?
  branch       Branch?  @relation(fields: [branchId], references: [id])
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())

  assignedLoans      Loan[]              @relation("AssignedOfficer")
  collectionOutcomes CollectionOutcome[]
  promises           PromiseToPay[]
  reminders          ReminderLog[]
  auditEvents        AuditEvent[]
}

model Branch {
  id        String   @id @default(cuid())
  code      String   @unique // e.g. "IND-PAL", "IND-VIJ", "PITH-01"
  name      String
  city      String   @default("Indore")
  state     String   @default("Madhya Pradesh")
  pincodes  String   // CSV list: "452001,452002,452003"
  loans     Loan[]
  users     User[]
}

model Borrower {
  id             String   @id @default(cuid())
  name           String   // e.g. "Company B (packaging unit)"
  contactPerson  String?
  businessType   String
  phone          String
  alternatePhone String?
  address        String
  pincode        String   // e.g. "452001"
  latitude       Float?
  longitude      Float?
  loans          Loan[]
}

model Loan {
  id                String    @id // e.g. "LN-10293", "LN-10871", "LN-11930"
  borrowerId        String
  borrower          Borrower  @relation(fields: [borrowerId], references: [id])
  branchId          String
  branch            Branch    @relation(fields: [branchId], references: [id])
  assignedOfficerId String?
  assignedOfficer   User?     @relation("AssignedOfficer", fields: [assignedOfficerId], references: [id])
  disbursedAmount   Float
  outstandingAmount Float
  dpd               Int       // Days Past Due
  dpdBucket         String    // "1-30", "31-60", "61-90", "90+"
  emiAmount         Float
  totalMissedEmis   Int       @default(1)
  lastPaymentDate   DateTime?
  lastPaymentAmount Float?

  // Explainable AI Engine
  priorityScore     Float     // 0 - 100
  priorityCategory  String    // "CRITICAL", "HIGH", "MEDIUM", "LOW"
  priorityReasons   String    // JSON serialized array of top 3 reasons
  priorityOverride  Boolean   @default(false)
  overrideScore     Float?
  overrideReason    String?

  status            String    @default("ACTIVE")
  promises          PromiseToPay[]
  collectionOutcomes CollectionOutcome[]
  reminders         ReminderLog[]
  auditEvents       AuditEvent[]
}

model PromiseToPay {
  id              String    @id @default(cuid())
  loanId          String
  loan            Loan      @relation(fields: [loanId], references: [id])
  officerId       String
  officer         User      @relation(fields: [officerId], references: [id])
  promisedAmount  Float
  promiseDate     DateTime
  status          String    // "PENDING", "DUE_TODAY", "FULFILLED", "BROKEN", "CANCELLED"
  notes           String?
  fulfilledDate   DateTime?
  fulfilledAmount Float?
  outcomes        CollectionOutcome[]
}

model CollectionOutcome {
  id               String        @id @default(cuid())
  idempotencyKey   String        @unique // Prevents offline replay duplicates
  loanId           String
  loan             Loan          @relation(fields: [loanId], references: [id])
  officerId        String
  officer          User          @relation(fields: [officerId], references: [id])
  outcomeType      String        // "PAID", "PROMISE_TO_PAY", "NOT_REACHABLE", "DISPUTE"
  amountCollected  Float?
  paymentMode      String?       // "UPI", "CASH", "NEFT_RTGS", "CHEQUE"
  receiptNumber    String?
  promiseId        String?
  promise          PromiseToPay? @relation(fields: [promiseId], references: [id])
  followUpDate     DateTime?
  disputeReason    String?
  notes            String?
  latitude         Float?
  longitude        Float?
  isOfflineSync    Boolean       @default(false)
  clientRecordedAt DateTime      // Original timestamp on device
  serverReceivedAt DateTime      @default(now())
}
```

---

## 3. Core Workflows

### 3.1 Field Officer Daily Prioritisation & 3-Tap Outcome Workflow
1. **Morning Terminal Boot:** Officer logs in on mobile device. The system checks local IndexedDB cache against `/api/officer/loans`.
2. **Contact Window Check:** Real-time clock inspects Asia/Kolkata (IST = UTC+5:30). If outside 8:00 AM – 7:00 PM IST, calling actions display regulatory explanation.
3. **AI Route Prioritisation:** Officers review daily borrower cards sorted by `priorityScore`. Each card displays outstanding amount, DPD bucket, active promise, and top 3 reasons.
4. **Outcome Logging (3-Tap Experience):**
   - *Tap 1:* Click "Log" button on borrower card.
   - *Tap 2:* Select Outcome Tab (`PAID` | `PROMISE_TO_PAY` | `NOT_REACHABLE` | `DISPUTE`).
   - *Tap 3:* Confirm amount/date and submit. The system automatically captures GPS coordinates, generates a unique idempotency key, records audit logs, updates outstanding balance, and recalculates AI priority.
5. **Offline Support:** If network is unavailable, event enters IndexedDB `syncQueue`. On reconnection, auto-sync deduplicates and commits records seamlessly.

### 3.2 Branch Manager CSV Import & Assignment Workflow
1. Manager drops CBS daily overdue CSV extract into browser.
2. Client and server validate schema headers (`Loan ID`, `Borrower Name`, `Outstanding Amount`, `DPD`, `Pincode`, `Branch`).
3. System checks for duplicate loan IDs across database records and within batch.
4. Intelligent routing engine matches borrower pincode against branch officer service areas and assigns accounts to the officer with the lowest active workload.
5. Manager reviews validation preview and commits import with a single click.

---

## 4. Explainable AI Prioritisation Engine

The priority score $S \in [0, 100]$ evaluates urgency and risk across 4 transparent mathematical components:

$$S = \min\left(100, \max\left(0, P_{\text{promise}} + P_{\text{dpd}} + P_{\text{exposure}} + P_{\text{history}}\right)\right)$$

### 4.1 Scoring Components
1. **Broken / Due Promise Impact ($P_{\text{promise}}$, Max 30 pts):**
   - Previously broken promise: $+30$ pts (*Reason: "Previously broken promise to pay"*)
   - Promise due today: $+26$ pts (*Reason: "Promise to pay is due today"*)
   - Active promise pending: $+12$ pts
   - No active promise: $+4$ pts

2. **DPD Roll-Rate Velocity ($P_{\text{dpd}}$, Max 30 pts):**
   - DPD 15–30 (approaching 31-day SMA-1 roll threshold): $+28$ pts (*Reason: "Loan is X days past due, nearing roll into 31–60 DPD bucket"*)
   - DPD 50–60 (critical roll risk into SMA-2): $+30$ pts
   - DPD > 60: $+26$ pts
   - DPD 10–14: $+20$ pts
   - DPD 1–9: $+10$ pts

3. **Outstanding Portfolio Exposure ($P_{\text{exposure}}$, Max 25 pts):**
   - Outstanding $\ge$ ₹5,00,000: $+25$ pts (*Reason: "High portfolio exposure of ₹X lakh"*)
   - Outstanding $\ge$ ₹2,00,000: $+18$ pts (*Reason: "Outstanding amount is ₹X lakh"*)
   - Outstanding $\ge$ ₹1,00,000: $+12$ pts
   - Outstanding < ₹1,00,000: $+6$ pts

4. **Default Track & Missed EMIs ($P_{\text{history}}$, Max 15 pts):**
   - Missed EMIs $\ge 3$: $+15$ pts (*Reason: "Persistent default with X missed monthly EMIs"*)
   - Missed EMIs $= 2$: $+10$ pts (*Reason: "Two consecutive missed EMIs"*)
   - Missed EMIs $= 1$: $+6$ pts (*Reason: "Single missed EMI instalment"*)

### 4.2 Benchmark Verification: Company D (LN-11930)
- **Borrower:** Company D (printing press)
- **DPD:** 19
- **Outstanding:** ₹2,20,000
- **Previous Promise:** Broken
- **Scoring Math:**
  $$P_{\text{promise}} = 30,\quad P_{\text{dpd}} = 28,\quad P_{\text{exposure}} = 18,\quad P_{\text{history}} = 10 \implies S = 86/100$$
- **Top 3 Displayed Reasons:**
  1. *Previously broken promise to pay.*
  2. *Loan is 19 days past due, nearing roll into 31-60 DPD bucket.*
  3. *Outstanding amount is ₹2.2 lakh.*

### 4.3 Model Governance & Regulatory Guardrails
- **Advisory Only:** Priority score serves exclusively for daily field scheduling and route optimization.
- **Strictly Prohibited:** Under no circumstances does the engine automate legal notices, asset seizures, or denial of banking services.
- **Supervisory Override:** Branch managers can override any algorithmic score with mandatory audit justification.
- **Limited Evidence Flag:** Accounts with $\le 1$ historical outcome display an explicit "Limited Evidence" badge.

---

## 5. UI/UX Design Decisions & Ergonomics

### Palette & Tokens
- **Background:** `#F8F8F5` (Warm off-white eliminating high-contrast eye fatigue in sunlight)
- **Primary Text:** `#171918` (Deep charcoal, WCAG AAA contrast)
- **Primary Accent:** `#176B4D` (Forest green used deliberately for key positive actions)
- **Supporting Neutral:** `#E8E9E3` (Muted stone)
- **Borders:** `#E2E4DE` (Crisp 1px borders)
- **Status Tones:** Success (`#15803D`), Warning (`#B45309`), Critical (`#B91C1C`)

### Ergonomics for Field Officers
- 48px minimum touch targets (`.touch-target`).
- Mobile-first bottom navigation (`/officer`, `/officer/promises`, `/officer/activity`).
- Quick-action buttons (Call, Map, Log) directly on list items to prevent excessive screen nesting.

---

## 6. Assumptions & Limitations

### Assumptions
1. Mobile devices run modern Chromium-based Android browsers with IndexedDB and Geolocation API support.
2. Central Banking System (CBS) exports daily overdue loans via CSV format.
3. Officers operate within designated Indore clusters (Palasia, Vijay Nagar, Pithampur Industrial Corridor, Rajwada).

### Limitations
1. SMS and WhatsApp dispatching is intentionally simulated for regulatory compliance during pilot sandbox evaluation.
2. Background GPS coordinates rely on browser geolocation permissions. In absence of hardware GPS, synthetic branch coordinates are preserved for demo continuity.

---

## 7. Security & Compliance Considerations

1. **Role-Based Access Control (RBAC):** Field officers are cryptographically scoped to view only their assigned loans. Branch managers access all records within their cluster.
2. **No Hardcoded Credentials:** Zero secrets stored in version control. All configuration parameters read through environment variables (`DATABASE_URL`, `SESSION_SECRET`).
3. **Audit Trail Integrity:** Every outcome log, priority override, and simulated reminder creates an immutable `AuditEvent` record with timestamps and officer IDs.
4. **Idempotent Network Defense:** Offline sync submissions require unique idempotency keys (`idemp-<timestamp>-<hash>`) preventing double-crediting during network blips.

---

## 8. What Was Cut & Future Roadmap

### Features Purposely Excluded from MVP Scope
- Third-party telecom SMS gateways (mocked to prevent accidental messages to real borrowers).
- Complex multi-cloud microservice orchestration (modular monolith prioritized for operational reliability).

### Future Roadmap (Phase 2 & 3)
- Integration with NPCI Bharat BillPay (BBPS) for instant UPI dynamic QR generation at doorstep.
- Multi-lingual voice note transcription for Hindi/Malwi dialect visit summaries.
- Route optimization with real-time Indore traffic clustering via OpenStreetMap.

