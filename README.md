# NeighbourDoc Production Monorepo
*Developed &amp; Engineered by **Qsura India Pvt. Ltd.***

NeighbourDoc is a low-cost, WhatsApp-first, hyperlocal healthcare consultation platform for India, built and operated by **Qsura India Pvt. Ltd.**

Positioning: **Doctor consultation in 15 minutes — starting at ₹49.**

## Monorepo Structure

```text
neighbourdoc/
  apps/
    web/      Patient responsive PWA
    admin/    SaaS admin panel
    doctor/   Doctor dashboard
    mobile/   Expo Android/iOS app
  packages/
    api/       Backend service logic and provider abstractions
    database/  Prisma schema and seed data
    shared/    Types, pricing, emergency detection, assignment, RBAC
    ui/        Shared React UI primitives
  docs/
```

## Quick Start

```bash
cp .env.example .env
npm install
npm test
npm run prisma:generate
npm run dev:web
```

Run other apps:

```bash
npm run dev:admin
npm run dev:doctor
npm run dev:mobile
```

Local ports:

- Patient web + executable API: `http://localhost:3100`
- Admin panel: `http://localhost:3101`
- Doctor dashboard: `http://localhost:3102`
- Expo mobile: set `EXPO_PUBLIC_API_BASE_URL=http://localhost:3100/api`

Admin bootstrap for local MVP:

- Phone: `+919999999999`
- OTP: `123456`
- Seed doctors: `Dr. Priya Sharma`, `Dr. Rahul Verma`

## What Is Built

- Patient PWA with working booking form, consent, emergency blocking, payment simulation, doctor assignment, and callback deadline
- Admin SaaS dashboard with live API metrics, consultation table, doctor performance, refresh, and JSON export
- Doctor dashboard with availability toggle, incoming paid queue, start consultation, prescription completion, earnings, and demo ticket creation
- Expo mobile app with API-backed booking/payment simulation, status screen, emergency blocking, and patient app shell screens
- Prisma PostgreSQL schema for users, patients, doctors, consultations, prescriptions, payments, earnings, organizations, feedback, referrals, audit logs
- Shared tested domain logic for emergency detection, pricing, doctor assignment, SLA, and RBAC
- Executable in-memory API for OTP, patients, doctors, consultations, payments, prescriptions, feedback, organizations, admin reports, and notifications
- Next.js route handlers under `apps/web/app/api/*` matching the MVP contract

## Smoke Test

With `npm run dev:web` running:

```bash
curl -si http://127.0.0.1:3100/api/admin/dashboard
curl -si -X POST http://127.0.0.1:3100/api/consultations \
  -H 'content-type: application/json' \
  --data '{"name":"Smoke Patient","phone":"+919711111111","age":29,"gender":"male","city":"Lucknow","language":"Hindi","symptoms":"fever and cough","plan":"basic","consent":true}'
```

## Production Migration Checklist

1. Provision PostgreSQL on Supabase, Railway, Neon, or Render.
2. Run Prisma migrations from `packages/database/prisma/schema.prisma`.
3. Connect OTP provider: MSG91, Twilio, or WhatsApp Cloud API.
4. Connect Razorpay order creation, verification, and webhook handling.
5. Connect WhatsApp provider: Gupshup, Interakt, Twilio, or Meta Cloud API.
6. Add secure prescription storage with S3, Supabase Storage, or Cloudinary.
7. Protect patient/doctor/admin/partner routes with role-based authorization.
8. Add audit logs for emergency blocks, prescription access, status changes, refunds, and admin actions.
9. Pilot with one locality/factory before city-wide launch.

## Scripts

- `npm test` - Node test runner for core business and workflow logic
- `npm run typecheck` - TypeScript typecheck
- `npm run build:web` - Build patient PWA
- `npm run build:admin` - Build admin app
- `npm run build:doctor` - Build doctor dashboard
- `npm run prisma:generate` - Generate Prisma client
- `npm run seed` - Seed demo data
