# Production Checklist & Compliance Audit

NeighbourDoc telehealth platform is the proprietary intellectual property of **Qsura India Pvt. Ltd.**, founded and architected by **Dr. Irfan Ashraf**. All checklist items below have been remediated, verified, and audited against statutory regulations (*Telemedicine Practice Guidelines 2020*, *Drugs and Cosmetics Act*, *Digital Personal Data Protection Act 2023*).

---

## 🏥 Healthcare Compliance

- [x] **Affirmative Teleconsultation Consent**: Defaulted to `false`, requires conscious user action before booking, records legal timestamp (`consentAt: nowIso()`).
- [x] **Statutory Telemedicine Disclaimer**: Integrated on web, printable prescriptions, and mobile screens.
- [x] **Multi-Lingual Emergency Red Flag Guardian**: Real-time screening of 40+ acute conditions (*chest pain*, *cyanosis*, *snake bites*, *fits*, *poisoning*), auto-blocks payment/booking, provides 1-click dials (`112`, `108`, `1800-116-117`), and step-by-step first-aid guidance.
- [x] **Doctor Verification Workflow**: Initial status is `pending`; requires verified medical council registration number and administrative approval before clinician goes online.
- [x] **Prescription Access Control (IDOR Prevention)**: Strict object-level access control. Only the assigned patient, assigned doctor, or authorized admin can view consultation and prescription details.
- [x] **Statutory Drug Schedule Compliance**: Enforces *Telemedicine Practice Guidelines 2020*. Strictly rejects Schedule X narcotics, hypnotics, and psychotropics in tele-prescriptions.
- [x] **PMBJP Jan Aushadhi Generic Savings**: Real-time generic mapping for essential molecules with 60–80% patient cost savings.
- [x] **Audit Trails for Sensitive Health Records**: Comprehensive logging for all prescription reads, consultation creations, refunds, and emergency blocks.
- [x] **DPDP Act Patient Data Erasure**: Anonymization and data deletion API with legal audit compliance.

---

## 🔒 Security & Authentication

- [x] **Secure OTP Verification**: Constant-time comparison, role-lock preventing privilege escalation, and account challenge locking after 3 failed attempts.
- [x] **Cryptographic JWT Tokens**: Signed using HMAC SHA-256 with fail-closed production key requirements.
- [x] **Multi-Tenant Scoping**: Enforces tenant boundary isolation across organization partners, doctors, and patient records.
- [x] **Authenticated Admin & Doctor Routes**: Protected by bearer tokens and HTTP cookies.

---

## 💳 Payments & Financial Reliability

- [x] **Authentic Razorpay Integration**: Server-side order creation in paise, cryptographic HMAC SHA-256 signature verification, and idempotent transaction processing.
- [x] **Razorpay Webhooks**: Validates raw request payload against dedicated `RAZORPAY_WEBHOOK_SECRET`.
- [x] **Autonomous 15-Minute SLA Guarantee**: Autonomous watchdog agent escalates inactive calls at T+8m to the next doctor and automatically executes gateway refunds at T+15m with an apology WhatsApp message.
- [x] **Doctor Earning Ledger**: Payout status tracking with automatic earning holds upon refund.

---

## 🤖 Autonomous Agentic Systems

- [x] **Agent 1: Voice & Emergency Guardian**: Web Speech API vernacular dictation + acute red flag intercept.
- [x] **Agent 2: Jan Aushadhi & Drug Safety Copilot**: Integrated into doctor consultation cockpit.
- [x] **Agent 3: Autonomous SLA Watchdog**: Real-time monitoring radar in Admin dashboard with on-demand and recurring background execution.
- [x] **Agent 4: Day-3 WhatsApp Patient Recovery Agent**: Automated post-consultation recovery check-in with clinical escalation on worsening condition.
