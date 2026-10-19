# Deployment Guide

## Web Apps

Deploy these apps to Vercel:

- `apps/web`
- `apps/admin`
- `apps/doctor`

Set the root directory per Vercel project and include shared workspace packages.

For the current local MVP, `apps/web` hosts the executable API route handlers. `apps/admin` and `apps/doctor` proxy `/api/*` to the patient/API app through `NEIGHBOURDOC_API_ORIGIN`.

## Backend

Use `packages/api` as the service module layer. The MVP includes in-memory route handlers for local execution; production should swap persistence to Prisma/PostgreSQL while keeping the same contracts. It can be hosted through:

- Next.js route handlers
- NestJS
- Express/Fastify
- Serverless functions

Recommended first production setup:

- Vercel for web apps
- Supabase or Railway PostgreSQL
- Prisma for migrations
- Supabase Storage or S3 for prescriptions
- Razorpay for payments
- Interakt/Gupshup/Twilio/Meta Cloud API for WhatsApp

## Mobile

Use Expo EAS:

```bash
cd apps/mobile
npx eas build --platform android
npx eas build --platform ios
```

Configure:

- `EXPO_PUBLIC_API_BASE_URL`
- push notification credentials
- Android package `com.neighbourdoc.app`
- iOS bundle `com.neighbourdoc.app`

## Security

- Store secrets in platform environment variables.
- Never expose Razorpay secret or WhatsApp access token to clients.
- Verify webhooks before state changes.
- Use signed URLs for prescription files.
- Enforce role checks on every read/write.
- Rate-limit OTP and booking endpoints.

## Environment

Set these in Vercel or your backend host:

- `DATABASE_URL`
- `JWT_SECRET`
- `OTP_PROVIDER`
- `OTP_TEST_CODE` for local/demo only
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `WHATSAPP_PROVIDER`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `NEIGHBOURDOC_API_ORIGIN` for admin/doctor proxying
