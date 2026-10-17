# Testing

Current implemented tests:

- emergency detection
- consultation pricing
- doctor assignment
- role authorization
- OTP start/verify workflow
- paid consultation lifecycle
- emergency audit logging
- doctor onboarding and availability
- organization membership
- outbound notification queue
- admin dashboard metrics

Run:

```bash
npm test
```

Recommended next tests:

- Razorpay webhook signature test with known payload and secret
- OTP rate-limit test
- prescription access restriction test
- partner organization scoping test
- SLA reassignment/escalation test
