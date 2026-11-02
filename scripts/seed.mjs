import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CollectIQ Database with Indore NBFC synthetic dataset...");

  // Clean existing tables in order
  await prisma.auditEvent.deleteMany({});
  await prisma.reminderLog.deleteMany({});
  await prisma.collectionOutcome.deleteMany({});
  await prisma.promiseToPay.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.borrower.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.rollRateSnapshot.deleteMany({});

  // 1. Create Branches
  const brPalasia = await prisma.branch.create({
    data: {
      id: "br-ind-pal",
      code: "IND-PAL",
      name: "Indore - Palasia Commercial Branch",
      city: "Indore",
      state: "Madhya Pradesh",
      pincodes: "452001,452002,452003,452007",
    },
  });

  const brVijayNagar = await prisma.branch.create({
    data: {
      id: "br-ind-vij",
      code: "IND-VIJ",
      name: "Indore - Vijay Nagar Retail Hub",
      city: "Indore",
      state: "Madhya Pradesh",
      pincodes: "452010,452011,452012",
    },
  });

  const brPithampur = await prisma.branch.create({
    data: {
      id: "br-pith-01",
      code: "PITH-01",
      name: "Pithampur SME & Industrial Hub",
      city: "Indore/Dhar",
      state: "Madhya Pradesh",
      pincodes: "454774,454775",
    },
  });

  // 2. Create Users (Demo Manager and Field Officers)
  const managerAnand = await prisma.user.create({
    data: {
      id: "usr-mgr-anand",
      email: "anand.verma@collectiq.in",
      name: "Anand Verma",
      passwordHash: "demo_hash_pwd123",
      role: "MANAGER",
      phone: "+91 98260 99887",
      branchId: brPalasia.id,
    },
  });

  const officerRahul = await prisma.user.create({
    data: {
      id: "usr-off-rahul",
      email: "rahul.chouhan@collectiq.in",
      name: "Rahul Chouhan",
      passwordHash: "demo_hash_pwd123",
      role: "OFFICER",
      phone: "+91 98260 11234",
      branchId: brPalasia.id,
    },
  });

  const officerNeha = await prisma.user.create({
    data: {
      id: "usr-off-neha",
      email: "neha.solanki@collectiq.in",
      name: "Neha Solanki",
      passwordHash: "demo_hash_pwd123",
      role: "OFFICER",
      phone: "+91 98260 22345",
      branchId: brVijayNagar.id,
    },
  });

  const officerImran = await prisma.user.create({
    data: {
      id: "usr-off-imran",
      email: "imran.qureshi@collectiq.in",
      name: "Imran Qureshi",
      passwordHash: "demo_hash_pwd123",
      role: "OFFICER",
      phone: "+91 98260 33456",
      branchId: brPithampur.id,
    },
  });

  // 3. Create Borrowers
  const borrowerB = await prisma.borrower.create({
    data: {
      id: "bor-company-b",
      name: "Company B (packaging unit)",
      contactPerson: "Rajesh Porwal",
      businessType: "Corrugated Box Manufacturing",
      phone: "9826045612",
      alternatePhone: "9826045613",
      address: "Plot 14, Sanwer Road Industrial Area, Sector A",
      pincode: "452001",
      latitude: 22.7533,
      longitude: 75.8722,
    },
  });

  const borrowerC = await prisma.borrower.create({
    data: {
      id: "bor-company-c",
      name: "Company C (fertiliser shop)",
      contactPerson: "Dinesh Patidar",
      businessType: "Agri-Inputs & Fertiliser Retail",
      phone: "9826078945",
      alternatePhone: "9826078946",
      address: "Shop 42, Krishi Upaj Mandi Road, Near Vijay Nagar Chowk",
      pincode: "452010",
      latitude: 22.7538,
      longitude: 75.8937,
    },
  });

  const borrowerD = await prisma.borrower.create({
    data: {
      id: "bor-company-d",
      name: "Company D (printing press)",
      contactPerson: "Mahesh Sharma",
      businessType: "Commercial Offset & Packaging Printing",
      phone: "9826090123",
      alternatePhone: "9826090124",
      address: "Shed 88, Pithampur Industrial Phase II",
      pincode: "454775",
      latitude: 22.6148,
      longitude: 75.6882,
    },
  });

  const borrowerE = await prisma.borrower.create({
    data: {
      id: "bor-malwa-textiles",
      name: "Malwa Fabricators & Textile",
      contactPerson: "Vikram Rathi",
      businessType: "Garment Job Work",
      phone: "9826011478",
      address: "18/2 Cloth Market, Rajwada Outer",
      pincode: "452002",
      latitude: 22.7196,
      longitude: 75.8577,
    },
  });

  const borrowerF = await prisma.borrower.create({
    data: {
      id: "bor-om-auto",
      name: "Om Sai Auto Spares",
      contactPerson: "Rameshwar Gurjar",
      businessType: "Commercial Vehicle Parts",
      phone: "9826033698",
      address: "Loha Mandi, Dewas Naka",
      pincode: "452010",
      latitude: 22.7756,
      longitude: 75.9088,
    },
  });

  const borrowerG = await prisma.borrower.create({
    data: {
      id: "bor-narmada-polymers",
      name: "Narmada Polymer Moulds",
      contactPerson: "Sunil Jain",
      businessType: "Plastic Component Extrusion",
      phone: "9826055874",
      address: "Plot 7, Sector 3, Pithampur",
      pincode: "454774",
      latitude: 22.6192,
      longitude: 75.6791,
    },
  });

  const borrowerH = await prisma.borrower.create({
    data: {
      id: "bor-shree-traders",
      name: "Shree Mahaveer Grain Traders",
      contactPerson: "Praveen Kothari",
      businessType: "Grain Wholesaler",
      phone: "9826022415",
      address: "Siyaganj Wholesale Market",
      pincode: "452007",
      latitude: 22.7161,
      longitude: 75.8665,
    },
  });

  // 4. Create Loans with AI priority scores & reasons

  // LN-10293: Rahul Chouhan, ₹6,40,000, DPD 12, Promise 2026-11-05
  const loan1 = await prisma.loan.create({
    data: {
      id: "LN-10293",
      borrowerId: borrowerB.id,
      branchId: brPalasia.id,
      assignedOfficerId: officerRahul.id,
      disbursedAmount: 1200000,
      outstandingAmount: 640000,
      dpd: 12,
      dpdBucket: "1-30",
      emiAmount: 48500,
      totalMissedEmis: 1,
      lastPaymentDate: new Date("2026-09-28"),
      lastPaymentAmount: 48500,
      priorityScore: 57,
      priorityCategory: "MEDIUM",
      priorityReasons: JSON.stringify([
        "High portfolio exposure of ₹6.4 lakh.",
        "Loan is 12 days past due.",
        "Active promise to pay pending verification.",
      ]),
      status: "ACTIVE",
    },
  });

  // LN-10871: Neha Solanki, ₹3,10,000, DPD 27, Promise None
  const loan2 = await prisma.loan.create({
    data: {
      id: "LN-10871",
      borrowerId: borrowerC.id,
      branchId: brVijayNagar.id,
      assignedOfficerId: officerNeha.id,
      disbursedAmount: 600000,
      outstandingAmount: 310000,
      dpd: 27,
      dpdBucket: "1-30",
      emiAmount: 26000,
      totalMissedEmis: 1,
      lastPaymentDate: new Date("2026-09-15"),
      lastPaymentAmount: 26000,
      priorityScore: 74,
      priorityCategory: "HIGH",
      priorityReasons: JSON.stringify([
        "Loan is 27 days past due, nearing roll into 31-60 DPD bucket.",
        "Outstanding amount is ₹3.1 lakh.",
        "Single missed EMI instalment.",
      ]),
      status: "ACTIVE",
    },
  });

  // LN-11930: Imran Qureshi, ₹2,20,000, DPD 19, Promise 2026-10-31 (Broken) -> Score: 86!
  const loan3 = await prisma.loan.create({
    data: {
      id: "LN-11930",
      borrowerId: borrowerD.id,
      branchId: brPithampur.id,
      assignedOfficerId: officerImran.id,
      disbursedAmount: 500000,
      outstandingAmount: 220000,
      dpd: 19,
      dpdBucket: "1-30",
      emiAmount: 22500,
      totalMissedEmis: 2,
      lastPaymentDate: new Date("2026-08-30"),
      lastPaymentAmount: 22500,
      priorityScore: 86,
      priorityCategory: "CRITICAL",
      priorityReasons: JSON.stringify([
        "Previously broken promise to pay.",
        "Loan is 19 days past due, nearing roll into 31-60 DPD bucket.",
        "Outstanding amount is ₹2.2 lakh.",
      ]),
      status: "ACTIVE",
    },
  });

  // Additional loans assigned to Rahul Chouhan so Rahul's officer dashboard has rich, realistic operational cases
  const loan4 = await prisma.loan.create({
    data: {
      id: "LN-11405",
      borrowerId: borrowerE.id,
      branchId: brPalasia.id,
      assignedOfficerId: officerRahul.id,
      disbursedAmount: 900000,
      outstandingAmount: 480000,
      dpd: 29,
      dpdBucket: "1-30",
      emiAmount: 38000,
      totalMissedEmis: 2,
      lastPaymentDate: new Date("2026-09-05"),
      lastPaymentAmount: 38000,
      priorityScore: 88,
      priorityCategory: "CRITICAL",
      priorityReasons: JSON.stringify([
        "Loan is 29 days past due, nearing roll into 31-60 DPD bucket.",
        "Outstanding amount is ₹4.8 lakh.",
        "Two consecutive missed EMIs.",
      ]),
      status: "ACTIVE",
    },
  });

  const loan5 = await prisma.loan.create({
    data: {
      id: "LN-11522",
      borrowerId: borrowerF.id,
      branchId: brPalasia.id,
      assignedOfficerId: officerRahul.id,
      disbursedAmount: 400000,
      outstandingAmount: 185000,
      dpd: 8,
      dpdBucket: "1-30",
      emiAmount: 16200,
      totalMissedEmis: 1,
      lastPaymentDate: new Date("2026-10-02"),
      lastPaymentAmount: 16200,
      priorityScore: 48,
      priorityCategory: "MEDIUM",
      priorityReasons: JSON.stringify([
        "Outstanding balance of ₹1.9 lakh.",
        "Early stage delinquency of 8 DPD.",
        "Single missed EMI instalment.",
      ]),
      status: "ACTIVE",
    },
  });

  const loan6 = await prisma.loan.create({
    data: {
      id: "LN-10619",
      borrowerId: borrowerH.id,
      branchId: brPalasia.id,
      assignedOfficerId: officerRahul.id,
      disbursedAmount: 1500000,
      outstandingAmount: 890000,
      dpd: 48,
      dpdBucket: "31-60",
      emiAmount: 62000,
      totalMissedEmis: 3,
      lastPaymentDate: new Date("2026-08-15"),
      lastPaymentAmount: 62000,
      priorityScore: 92,
      priorityCategory: "CRITICAL",
      priorityReasons: JSON.stringify([
        "High portfolio exposure of ₹8.9 lakh.",
        "Persistent default with 3 missed monthly EMIs.",
        "Loan is 48 days past due, nearing roll into 60+ DPD.",
      ]),
      status: "ACTIVE",
    },
  });

  // 5. Create Promises to Pay
  // For LN-10293: Due on 2026-11-05
  await prisma.promiseToPay.create({
    data: {
      id: "ptp-10293",
      loanId: loan1.id,
      officerId: officerRahul.id,
      promisedAmount: 48500,
      promiseDate: new Date("2026-11-05"),
      status: "PENDING",
      notes: "Borrower expects post-Diwali payment settlement from OEM client.",
    },
  });

  // For LN-11930: Broken promise on 2026-10-31
  const brokenPtp = await prisma.promiseToPay.create({
    data: {
      id: "ptp-11930",
      loanId: loan3.id,
      officerId: officerImran.id,
      promisedAmount: 22500,
      promiseDate: new Date("2026-10-31"),
      status: "BROKEN",
      notes: "Customer promised RTGS transfer before month-end, cheque bounced.",
    },
  });

  // For LN-11405: Due Today (2026-11-02)
  await prisma.promiseToPay.create({
    data: {
      id: "ptp-11405",
      loanId: loan4.id,
      officerId: officerRahul.id,
      promisedAmount: 38000,
      promiseDate: new Date("2026-11-02"),
      status: "DUE_TODAY",
      notes: "Agreed to hand over cash instalment during afternoon factory visit.",
    },
  });

  // 6. Create Historical Collection Outcomes & Audits
  await prisma.collectionOutcome.create({
    data: {
      id: "out-001",
      idempotencyKey: "seed-idemp-001",
      loanId: loan3.id,
      officerId: officerImran.id,
      outcomeType: "DISPUTE",
      disputeReason: "Raw material consignment stuck, invoices contested with vendor.",
      notes: "Visited Pithampur workshop. Owner claims billing mismatch with partner.",
      latitude: 22.6148,
      longitude: 75.6882,
      isOfflineSync: false,
      clientRecordedAt: new Date("2026-10-31T11:45:00Z"),
      promiseId: brokenPtp.id,
    },
  });

  await prisma.collectionOutcome.create({
    data: {
      id: "out-002",
      idempotencyKey: "seed-idemp-002",
      loanId: loan1.id,
      officerId: officerRahul.id,
      outcomeType: "PROMISE_TO_PAY",
      amountCollected: null,
      notes: "Met Mr. Porwal at packaging warehouse. Committed to pay by 5th Nov via UPI.",
      latitude: 22.7533,
      longitude: 75.8722,
      isOfflineSync: false,
      clientRecordedAt: new Date("2026-10-29T15:20:00Z"),
    },
  });

  await prisma.collectionOutcome.create({
    data: {
      id: "out-003",
      idempotencyKey: "seed-idemp-003",
      loanId: loan5.id,
      officerId: officerRahul.id,
      outcomeType: "PAID",
      amountCollected: 16200,
      paymentMode: "UPI",
      receiptNumber: "RC-2026-8819",
      notes: "Collected full EMI via BharatPe QR at counter.",
      latitude: 22.7756,
      longitude: 75.9088,
      isOfflineSync: false,
      clientRecordedAt: new Date("2026-11-01T14:10:00Z"),
    },
  });

  // 7. Roll-Rate Historical Snapshots (for Roll-rate trends and manager analytics)
  await prisma.rollRateSnapshot.createMany({
    data: [
      {
        periodLabel: "Aug 2026",
        branchId: brPalasia.id,
        total1to30Count: 145,
        total1to30Volume: 82500000,
        rolledTo31to60Count: 22,
        rolledTo31to60Volume: 12800000,
        rollRatePercent: 15.2,
        curedCount: 118,
        curedVolume: 66500000,
        cureRatePercent: 81.4,
      },
      {
        periodLabel: "Sep 2026",
        branchId: brPalasia.id,
        total1to30Count: 158,
        total1to30Volume: 89000000,
        rolledTo31to60Count: 25,
        rolledTo31to60Volume: 14600000,
        rollRatePercent: 15.8,
        curedCount: 126,
        curedVolume: 71200000,
        cureRatePercent: 79.7,
      },
      {
        periodLabel: "Oct 2026",
        branchId: brPalasia.id,
        total1to30Count: 162,
        total1to30Volume: 94200000,
        rolledTo31to60Count: 29,
        rolledTo31to60Volume: 17100000,
        rollRatePercent: 17.9,
        curedCount: 124,
        curedVolume: 72000000,
        cureRatePercent: 76.5,
      },
    ],
  });

  console.log("Database seeded successfully with demo users, loans, and historical snapshots.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
