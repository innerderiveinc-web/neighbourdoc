import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import {
  createDemoApi,
  createJwtToken,
  verifyJwtToken,
  verifyRazorpaySignature,
  canAccessConsultation,
  type AuthTokenPayload
} from "../index.ts";

test("SECURITY: prevents privilege escalation during OTP verification", () => {
  const api = createDemoApi(":memory:");

  // Patient requests OTP
  const sendRes = api.sendOtp({ phone: "+919876543299", role: "admin" });
  assert.equal(sendRes.ok, true);

  // Malicious user attempts to claim 'admin' or 'superadmin' role in verifyOtp payload
  const attackRes = api.verifyOtp({
    phone: "+919876543299",
    code: "123456",
    role: "admin" as any
  });

  assert.equal(attackRes.ok, true);
  // Authoritative role must remain 'patient'
  assert.equal(attackRes.role, "patient");
  const payload = verifyJwtToken(attackRes.sessionToken).payload;
  assert.equal(payload?.role, "patient");
});

test("SECURITY: locks OTP challenge after 3 incorrect verification attempts", () => {
  const api = createDemoApi(":memory:");
  const phone = "+919111222333";

  api.sendOtp({ phone });

  // Attempt 1 with wrong code
  const res1 = api.verifyOtp({ phone, code: "999999" });
  assert.equal(res1.ok, false);

  // Attempt 2 with wrong code
  const res2 = api.verifyOtp({ phone, code: "888888" });
  assert.equal(res2.ok, false);

  // Attempt 3 with wrong code
  const res3 = api.verifyOtp({ phone, code: "777777" });
  assert.equal(res3.ok, false);

  // 4th attempt should be locked out even if test code is submitted
  const res4 = api.verifyOtp({ phone, code: "123456" });
  assert.equal(res4.ok, false);
  assert.match(res4.error ?? "", /exceeded|expired/i);
});

test("SECURITY: verifies authentic Razorpay HMAC SHA256 signatures and rejects forged signatures", () => {
  const secret = "test_key_secret_for_razorpay_gateway_32bytes";
  const orderId = "order_123456";
  const paymentId = "pay_987654";
  const payload = `${orderId}|${paymentId}`;

  const validSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const isAuthentic = verifyRazorpaySignature(payload, validSignature, secret);
  assert.equal(isAuthentic, true);

  // Tampered payload
  const isTampered = verifyRazorpaySignature(payload + "_tampered", validSignature, secret);
  assert.equal(isTampered, false);

  // Forged signature
  const isForged = verifyRazorpaySignature(payload, "forged_hex_signature_here", secret);
  assert.equal(isForged, false);
});

test("SECURITY: enforces record-level access control (IDOR prevention)", () => {
  const patient1: AuthTokenPayload = {
    sub: "user_patient_1",
    phone: "+919000000001",
    role: "patient"
  };
  const patient2: AuthTokenPayload = {
    sub: "user_patient_2",
    phone: "+919000000002",
    role: "patient"
  };
  const doctor1: AuthTokenPayload = {
    sub: "user_doc_1",
    doctorId: "doctor_1",
    phone: "+919800000001",
    role: "doctor"
  };
  const doctor2: AuthTokenPayload = {
    sub: "user_doc_2",
    doctorId: "doctor_2",
    phone: "+919800000002",
    role: "doctor"
  };
  const admin: AuthTokenPayload = {
    sub: "user_admin",
    phone: "+919999999999",
    role: "admin"
  };

  const consultation = {
    id: "consultation_xyz",
    patientUserId: "user_patient_1",
    doctorId: "doctor_1",
    doctorUserId: "user_doc_1"
  };

  // Patient 1 can access own consultation
  assert.equal(canAccessConsultation(patient1, consultation), true);

  // Patient 2 is blocked from Patient 1's consultation
  assert.equal(canAccessConsultation(patient2, consultation), false);

  // Doctor 1 (assigned) can access
  assert.equal(canAccessConsultation(doctor1, consultation), true);

  // Doctor 2 (unassigned) is blocked
  assert.equal(canAccessConsultation(doctor2, consultation), false);

  // Admin has access
  assert.equal(canAccessConsultation(admin, consultation), true);
});

test("SECURITY: prevents clinicians from self-approving or modifying other doctors", () => {
  const api = createDemoApi(":memory:");

  // Doctor 1 cannot update Doctor 2's profile
  const doctor1Actor: AuthTokenPayload = {
    sub: "user_doctor_1",
    doctorId: "doctor_1",
    phone: "+919800000001",
    role: "doctor"
  };

  assert.throws(
    () => {
      api.updateDoctor("doctor_2", { city: "Varanasi" }, doctor1Actor);
    },
    /Forbidden/
  );

  assert.throws(
    () => {
      api.setDoctorAvailability("doctor_2", "offline", doctor1Actor);
    },
    /Forbidden/
  );

  // Doctor 1 cannot self-increase their payout share
  const selfUpdated = api.updateDoctor(
    "doctor_1",
    { city: "Varanasi", payoutShare: 90 as any },
    doctor1Actor
  );
  assert.equal(selfUpdated.city, "Varanasi");
  assert.equal(selfUpdated.payoutShare, 30); // Privileged field ignored!
});

test("CLINICAL SAFETY: new doctors start with 'pending' verification and require administrative approval", () => {
  const api = createDemoApi(":memory:");

  const newDoctor = api.createDoctor({
    name: "Dr. Vikas Sharma",
    phone: "+919822233344",
    city: "Lucknow",
    languages: ["Hindi", "English"],
    specialization: "General Physician",
    registrationNumber: "NMC-LKO-9999",
    consultationFee: 49
  });

  // Newly created doctor is pending verification
  assert.equal(newDoctor.verificationStatus, "pending");
  assert.equal(newDoctor.availabilityStatus, "offline");

  const adminActor: AuthTokenPayload = {
    sub: "user_admin_1",
    phone: "+919999999999",
    role: "admin"
  };

  // Administrative verification
  const verifiedDoctor = api.verifyDoctor(newDoctor.id, adminActor, "NMC credentials verified against state medical council database.");
  assert.equal(verifiedDoctor.verificationStatus, "verified");
  assert.equal(verifiedDoctor.availabilityStatus, "online");
});

test("DATA INTEGRITY: consultation completion and payment verification are strictly idempotent", () => {
  const api = createDemoApi(":memory:");

  const booking = api.createConsultation({
    name: "Mohan Das",
    phone: "+919833344455",
    age: 45,
    gender: "male",
    city: "Lucknow",
    language: "Hindi",
    symptoms: "Mild seasonal cough",
    plan: "basic",
    consent: true
  });
  assert.equal(booking.ok, true);
  const consultationId = booking.consultation.id;

  // Verify payment
  const paymentRes1 = api.verifyPayment({
    consultationId,
    orderId: "order_test_99",
    gatewayPaymentId: "pay_test_99"
  });
  assert.equal(paymentRes1.ok, true);

  // Re-verifying payment must be idempotent
  const paymentRes2 = api.verifyPayment({
    consultationId,
    orderId: "order_test_99",
    gatewayPaymentId: "pay_test_99"
  });
  assert.equal(paymentRes2.ok, true);
  assert.equal(paymentRes2.alreadyProcessed, true);

  // Complete consultation
  const comp1 = api.completeConsultation(consultationId, {
    medicines: "Cough syrup 10ml thrice daily",
    advice: "Steam inhalation twice daily"
  });
  assert.equal(comp1.consultation.status, "completed");

  const initialEarningsCount = api.listDoctorEarnings().length;

  // Repeated completeConsultation must NOT duplicate earnings or prescriptions
  const comp2 = api.completeConsultation(consultationId, {
    medicines: "Cough syrup 10ml thrice daily",
    advice: "Steam inhalation twice daily"
  });
  assert.equal(comp2.alreadyCompleted, true);
  assert.equal(api.listDoctorEarnings().length, initialEarningsCount);
});

test("HEALTHCARE SLA: executes 15-minute SLA breach refunds with audit trails and notifications", () => {
  const api = createDemoApi(":memory:");

  const booking = api.createConsultation({
    name: "Geeta Rani",
    phone: "+919844455566",
    age: 38,
    gender: "female",
    city: "Kanpur",
    language: "Hindi",
    symptoms: "Stomach ache",
    plan: "priority",
    consent: true
  });
  assert.equal(booking.ok, true);
  const consultationId = booking.consultation.id;

  // Pay
  api.verifyPayment({
    consultationId,
    orderId: "order_sla_1",
    gatewayPaymentId: "pay_sla_1"
  });

  const adminActor: AuthTokenPayload = {
    sub: "user_admin_1",
    phone: "+919999999999",
    role: "admin"
  };

  // Issue refund due to doctor SLA timeout
  const refundResult = api.executeRefund(
    consultationId,
    adminActor,
    "Doctor did not connect within 15-minute SLA guarantee"
  );

  assert.equal(refundResult.ok, true);
  assert.equal(refundResult.consultation.status, "refunded");
  assert.equal(refundResult.consultation.paymentStatus, "refunded");
  assert.equal(refundResult.payment?.status, "refunded");

  // Verify audit log
  const auditLogs = api.listAuditLogs();
  const refundLog = auditLogs.find((l) => l.action === "consultation_refund_executed");
  assert.ok(refundLog);
  assert.equal(refundLog.entityId, consultationId);
});

test("SUPPORT WORKFLOW: creates persistent contact and grievance support tickets", () => {
  const api = createDemoApi(":memory:");

  const ticketRes = api.createContactTicket({
    name: "Suresh Patel",
    phone: "+919877788899",
    message: "Need help regarding pharmacy receipt."
  });

  assert.equal(ticketRes.ok, true);
  assert.ok(ticketRes.ticketId.startsWith("ticket_"));

  const audit = api.listAuditLogs().find((l) => l.action === "contact_ticket_created");
  assert.ok(audit);
  assert.equal(audit.entityId, ticketRes.ticketId);
});

test("SECURITY: enforces multi-tenant organization scoping for partner roles", () => {
  const api = createDemoApi(":memory:");

  const orgA = api.createOrganization({
    name: "Acme Logistics",
    type: "warehouse",
    city: "Delhi",
    contactPerson: "HR Lead",
    phone: "+919877700001",
    planId: "org_custom"
  });

  const orgB = api.createOrganization({
    name: "Globex Corp",
    type: "office",
    city: "Mumbai",
    contactPerson: "Admin Lead",
    phone: "+919877700002",
    planId: "org_custom"
  });

  const partnerActorA: AuthTokenPayload = {
    sub: "user_partner_a",
    phone: "+919877700001",
    role: "partner",
    organizationId: orgA.id
  };

  // Partner A can add member to Org A
  const memberA = api.addOrganizationMember(
    orgA.id,
    {
      name: "Ravi Kumar",
      phone: "+919877711111",
      employeeCode: "EMP-001"
    },
    partnerActorA
  );
  assert.equal(memberA.organizationId, orgA.id);

  // Partner A is BLOCKED from adding member to Org B
  assert.throws(
    () => {
      api.addOrganizationMember(
        orgB.id,
        {
          name: "Attacker Injected",
          phone: "+919877722222",
          employeeCode: "HACK-001"
        },
        partnerActorA
      );
    },
    /Forbidden/
  );
});

test("SECURITY & DPDP: executes patient data erasure and anonymization with audit trail", () => {
  const api = createDemoApi(":memory:");

  // Create a patient consultation
  const consultationRes = api.createConsultation({
    name: "Deepak Sharma",
    phone: "+919888877777",
    age: 35,
    gender: "male",
    city: "Jaipur",
    language: "Hindi",
    symptoms: "Mild fever and cough",
    plan: "basic",
    consent: true
  });

  assert.equal(consultationRes.ok, true);
  const patientUserId = consultationRes.consultation.patientUserId;

  const patientActor: AuthTokenPayload = {
    sub: patientUserId,
    phone: "+919888877777",
    role: "patient"
  };

  const otherPatientActor: AuthTokenPayload = {
    sub: "user_other_intruder",
    phone: "+919888899999",
    role: "patient"
  };

  // Malicious patient cannot erase someone else's data
  assert.throws(
    () => {
      api.anonymizePatientData(patientUserId, otherPatientActor);
    },
    /Forbidden/
  );

  // Patient erases their own data under DPDP 2023
  const erasureRes = api.anonymizePatientData(patientUserId, patientActor);
  assert.equal(erasureRes.ok, true);

  // Verify personal identifiers are expunged
  const profile = api.getPatientMe(patientUserId);
  assert.equal(profile.user?.name, "Anonymized Patient");
  assert.equal(profile.user?.phone, "+910000000000");
  assert.equal(profile.patient?.city, "Redacted");

  // Verify audit log
  const erasureAudit = api.listAuditLogs().find((l) => l.action === "patient_data_erasure_executed");
  assert.ok(erasureAudit);
  assert.equal(erasureAudit.entityId, patientUserId);
});

test("SECURITY & AUDIT: logs prescription reading and access events", () => {
  const api = createDemoApi(":memory:");

  const booking = api.createConsultation({
    name: "Sunita Devi",
    phone: "+919876500001",
    age: 45,
    gender: "female",
    city: "Lucknow",
    language: "Hindi",
    symptoms: "Mild throat irritation",
    plan: "basic",
    consent: true
  });

  assert.equal(booking.ok, true);
  assert.ok(booking.consultation);

  const adminActor: AuthTokenPayload = {
    sub: "user_admin_1",
    phone: "+919999999999",
    role: "admin"
  };

  // Complete consultation and create prescription
  api.completeConsultation(
    booking.consultation.id,
    {
      medicines: "Paracetamol 500mg TDS, Gargle with warm water",
      advice: "Take rest, drink fluids"
    },
    adminActor
  );

  const patientActor: AuthTokenPayload = {
    sub: booking.consultation.patientUserId,
    phone: "+919876500001",
    role: "patient"
  };

  // Patient accesses their prescription
  const rx = api.getPrescriptionByConsultation(booking.consultation.id, patientActor);
  assert.ok(rx);

  // Audit log must reflect prescription access
  const accessLog = api.listAuditLogs().find((l) => l.action === "prescription_accessed");
  assert.ok(accessLog);
  assert.equal(accessLog.actorId, patientActor.sub);
});


