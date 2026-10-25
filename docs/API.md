# NeighbourDoc API Contract

The executable local MVP exposes these endpoints under `apps/web/app/api/*`, backed by `packages/api`.

Local base URL:

```text
http://localhost:3100/api
```

Web, admin, doctor, mobile, and WhatsApp flows should all use the same contracts.

## Auth

### POST `/api/auth/send-otp`
Request:
```json
{ "phone": "+919876543210", "role": "patient" }
```

### POST `/api/auth/verify-otp`
Request:
```json
{ "phone": "+919876543210", "code": "123456" }
```

### POST `/api/auth/logout`
Invalidates the current session.

## Patients

- `GET /api/patients/me`
- `PATCH /api/patients/me`

## Doctors

- `GET /api/doctors`
- `POST /api/doctors`
- `PATCH /api/doctors/:id`
- `PATCH /api/doctors/:id/availability`

Doctor assignment rules:

- verified doctors only
- available doctors only
- same city first
- same language first
- oldest `lastAssignedAt` wins within the best match group
- no match places consultation in queue

## Consultations

### POST `/api/consultations`
Creates a consultation after consent and emergency screening. Payment may be `payment_pending` until Razorpay confirms.

### GET `/api/consultations`
Role-scoped consultation list.

### GET `/api/consultations/:id`
Role-scoped consultation details.

### PATCH `/api/consultations/:id/status`
Allowed statuses: `paid`, `queued`, `assigned`, `in_consultation`, `completed`, `cancelled`, `refunded`, `escalated`.

### POST `/api/consultations/:id/assign-doctor`
Runs the assignment engine and records callback deadline.

### POST `/api/consultations/:id/complete`
Completes consultation, creates doctor earning, sends prescription notification.

## Prescriptions

- `POST /api/prescriptions`
- `GET /api/prescriptions/:consultationId`

Prescription access must be limited to the patient, assigned doctor, admin/superadmin, or owning partner organization. Prescriptions are validated against Schedule X prohibitions and mapped to Jan Aushadhi generic alternatives.

## Payments

- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `POST /api/payments/webhook`

Razorpay webhook body must be verified with HMAC SHA-256 before changing payment or consultation state.

## Telephony & Privacy

### POST `/api/telephony/call-bridge`
Initiates a PSTN click-to-call bridge between the clinician and patient while masking the patient's phone number (`+91 97XXXXXX01`) for complete DPDP privacy compliance.

## Support & Grievance

### POST `/api/contact`
Creates a persistent contact and grievance support ticket with audit logging.

## DPDP Compliance & Data Privacy

### DELETE `/api/patients/:id/erase`
Executes patient data erasure and anonymization under India's Digital Personal Data Protection (DPDP) Act, sanitizing identifiers while retaining anonymized clinical records for audit requirements.

## Feedback

- `POST /api/feedback`

## Organizations

- `POST /api/organizations`
- `GET /api/organizations/:id`
- `POST /api/organizations/:id/members`

## Admin & Operations

- `GET /api/admin/dashboard`
- `GET /api/admin/reports`
- `GET /api/admin/doctor-performance`
- `GET /api/admin/revenue`
- `GET /api/admin/settings` (Retrieves dynamic system fees, payout shares, SLA limits, and maintenance mode)
- `PUT /api/admin/settings` (Updates runtime operational settings with administrative audit trail)
- `POST /api/admin/sla-watchdog` (Executes the autonomous SLA Watchdog agent to auto-escalate at T+8m and auto-refund at T+15m)

## Notifications

- `POST /api/notifications/whatsapp`
- `POST /api/notifications/sms`
- `POST /api/notifications/push`

WhatsApp templates must support Hindi and English:

1. Booking started
2. Payment successful
3. Doctor assigned
4. Doctor will call in 15 minutes
5. Prescription ready
6. Feedback request
7. Follow-up reminder (Day-3 recovery check-in)
8. SLA breach apology (15-minute guarantee refund)
9. Doctor escalation alert
10. Follow-up escalation alert (free priority consultation review)
