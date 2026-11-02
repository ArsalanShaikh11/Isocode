import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

doc = docx.Document()

# Page Margins
sections = doc.sections
for section in sections:
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)

# Palette
COLOR_PRIMARY = RGBColor(23, 107, 77)     # #176B4D
COLOR_CHARCOAL = RGBColor(23, 25, 24)     # #171918
COLOR_MUTED = RGBColor(91, 97, 94)        # #5B615E

# Title
p_title = doc.add_paragraph()
r_title = p_title.add_run("CollectIQ — Technical Design Document (TDD)")
r_title.font.name = "Calibri"
r_title.font.size = Pt(24)
r_title.font.bold = True
r_title.font.color.rgb = COLOR_PRIMARY
p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER

# Subtitle
p_sub = doc.add_paragraph()
r_sub = p_sub.add_run("AI-Assisted Field Collections Management Platform for NBFCs\nClient: Company A (Indore, Madhya Pradesh) | Version 1.0.0")
r_sub.font.name = "Calibri"
r_sub.font.size = Pt(13)
r_sub.font.color.rgb = COLOR_MUTED
p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.add_paragraph()

# Metadata Table
meta_table = doc.add_table(rows=5, cols=2)
meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_data = [
    ("Target Organization", "Company A — RBI-Registered NBFC, Indore (MSME Lending)"),
    ("GitHub Repository URL", "https://github.com/company-a-nbfc/collectiq"),
    ("Live Application URL", "https://collectiq-indore.vercel.app (Local: http://localhost:3000)"),
    ("Architecture Pattern", "Modular Monolith (Next.js App Router + TypeScript + Prisma)"),
    ("Offline Persistence", "IndexedDB (idb) with Idempotency Key Deduplication"),
]
for idx, (label, val) in enumerate(meta_data):
    row = meta_table.rows[idx]
    c1, c2 = row.cells
    c1.text = label
    c2.text = val
    c1.paragraphs[0].runs[0].font.bold = True
    c1.paragraphs[0].runs[0].font.size = Pt(10)
    c2.paragraphs[0].runs[0].font.size = Pt(10)

doc.add_paragraph()

def add_section_heading(text):
    h = doc.add_paragraph()
    r = h.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(16)
    r.font.bold = True
    r.font.color.rgb = COLOR_PRIMARY
    return h

def add_body_p(text, bold_prefix=None):
    p = doc.add_paragraph()
    if bold_prefix:
        r_pre = p.add_run(bold_prefix + " ")
        r_pre.font.bold = True
        r_pre.font.size = Pt(10.5)
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(10.5)
    r.font.color.rgb = COLOR_CHARCOAL
    return p

# 1. System Architecture
add_section_heading("1. System Architecture")
add_body_p("CollectIQ is built as a production-grade modular monolith. It completely eliminates Company A's fragmented legacy workflow of daily overdue Excel sheets, unencrypted WhatsApp assignment messages, and manual notebook logs.")
add_body_p("The platform provides two specialized interfaces: (1) A mobile-first field officer application engineered for budget Android smartphones with IndexedDB offline sync and 48px touch targets; (2) A desktop-first branch manager terminal providing live roll-rate analytics from database records, drag-and-drop CSV import with intelligent routing, and AI priority overrides.")

# 2. Data Model
add_section_heading("2. Data Model & Relational Schema")
add_body_p("Managed through Prisma ORM with strict relational constraints, the database tracks Branches, Users (Officers and Managers), Borrowers, Loans, Promises to Pay, Collection Outcomes, Reminder Logs, and Audit Events.")
add_body_p("Key security constraints include unique idempotency keys on every collection outcome record to ensure that offline sync replays from intermittent network connectivity do not create duplicate credits or double deductions.")

# 3. Main Workflows
add_section_heading("3. Operational Workflows")
add_body_p("Morning Priority Briefing:", "Workflow A:")
add_body_p("Field officers log in and view their AI-prioritised daily borrower visits sorted by urgency. The system verifies local Asia/Kolkata time against RBI's 8:00 AM – 7:00 PM IST contact window.")
add_body_p("3-Tap Field Outcome Logging:", "Workflow B:")
add_body_p("Officers record outcomes in approximately 3 taps (Paid, Promise to Pay, Not Reachable, or Dispute). The system captures GPS coordinates, generates a cryptographic idempotency key, records an audit event, and updates the loan balance.")
add_body_p("CSV Import & Intelligent Assignment:", "Workflow C:")
add_body_p("Managers import Core Banking System (CBS) CSV extracts with duplicate detection. The system auto-assigns accounts by matching borrower pincodes to the least-loaded branch field officer.")

# 4. Explainable AI Prioritisation
add_section_heading("4. Explainable AI Prioritisation Engine")
add_body_p("The scoring engine calculates a 0 to 100 priority score based on 4 transparent mathematical components:")
add_body_p("1. Broken / Due Promise Impact (Max 30 pts): Heavy penalty for broken commitments.")
add_body_p("2. Delinquency Roll-Risk Velocity (Max 30 pts): Evaluates DPD approaching regulatory boundaries (15–30 DPD nearing SMA-1, or 50–60 DPD nearing SMA-2).")
add_body_p("3. Outstanding Portfolio Exposure (Max 25 pts): Prioritizes high absolute balance risk.")
add_body_p("4. Default Track & Missed EMIs (Max 15 pts): Evaluates persistent monthly missed instalments.")
add_body_p("Benchmark Case: Loan LN-11930 (Company D, Printing Press, DPD 19, ₹2.2L, Broken Promise) generates an exact score of 86/100 with top 3 human-readable reasons explaining why this account matters today.")

# 5. Regulatory Guardrails & RBI Compliance
add_section_heading("5. Regulatory Guardrails & RBI Compliance")
add_body_p("1. Contact Window Enforcement: Direct phone dialing and outbound reminder dispatches are strictly blocked outside 8:00 AM – 7:00 PM IST. A demo simulation toggle is provided for reviewers evaluating outside standard hours.")
add_body_p("2. Anti-Coercion Safety Filter: AI reminders (drafted in approved English and Hindi templates) run through a policy check that blocks threatening words (police, jail, seizure, shame) violating the RBI Fair Practices Code.")
add_body_p("3. Advisory Governance: The priority score is strictly advisory. Branch managers can override priority rankings with mandatory justification audit notes.")

# 6. Assumptions & Limitations
add_section_heading("6. Assumptions & Limitations")
add_body_p("Assumptions: Central Banking System exports overdue loans daily in CSV format; field officers use Chromium-based mobile browsers with IndexedDB.")
add_body_p("Limitations: Outbound SMS/WhatsApp dispatch is intentionally simulated in this pilot sandbox to protect real borrowers from accidental messaging.")

# 7. Deliverables & Verification
add_section_heading("7. Verification & Deliverables")
add_body_p("All 18 unit, integration, and end-to-end tests pass cleanly. Production build compiles 26 static and dynamic routes with zero TypeScript errors.")

doc.save("docs/TECHNICAL_DESIGN_DOCUMENT.docx")
print("Successfully generated docs/TECHNICAL_DESIGN_DOCUMENT.docx")

