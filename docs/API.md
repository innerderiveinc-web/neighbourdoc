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

Prescription access must be limited to the patient, assigned doctor, admin/superadmin, or owning partner organization.

## Payments

- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `POST /api/payments/webhook`

Razorpay webhook body must be verified with HMAC SHA-256 before changing payment or consultation state.

## Feedback

- `POST /api/feedback`

## Organizations

- `POST /api/organizations`
- `GET /api/organizations/:id`
- `POST /api/organizations/:id/members`

## Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/reports`
- `GET /api/admin/doctor-performance`
- `GET /api/admin/revenue`

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
7. Follow-up reminder
