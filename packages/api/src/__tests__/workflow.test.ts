import assert from "node:assert/strict";
import test from "node:test";
import { createDemoApi, createJwtToken, verifyJwtToken } from "../index.ts";

test("runs the paid consultation lifecycle from OTP through feedback", () => {
  const api = createDemoApi();

  const otp = api.sendOtp({ phone: "+919876543210", role: "patient" });
  assert.equal(otp.ok, true);

  const session = api.verifyOtp({ phone: "+919876543210", code: "123456" });
  assert.equal(session.ok, true);

  const consultation = api.createConsultation({
    name: "Ramesh Kumar",
    phone: "+919876543210",
    age: 34,
    gender: "male",
    city: "Lucknow",
    locality: "Transport Nagar",
    language: "Hindi",
    symptoms: "Fever and cough for two days",
    existingIllnesses: "No known diabetes or BP",
    plan: "basic",
    consent: true,
    referralSource: "factory_hr"
  });

  assert.equal(consultation.ok, true);
  assert.equal(consultation.consultation.paymentStatus, "pending");
  assert.equal(consultation.consultation.status, "payment_pending");

  const order = api.createPaymentOrder({ plan: "basic", consultationId: consultation.consultation.id });
  assert.equal(order.amount, 4900);

  const paid = api.verifyPayment({
    consultationId: consultation.consultation.id,
    orderId: order.orderId,
    gatewayPaymentId: "pay_test_123"
  });

  assert.equal(paid.ok, true);
  assert.equal(paid.consultation.paymentStatus, "paid");
  assert.equal(paid.consultation.status, "assigned");
  assert.ok(paid.consultation.doctorId);
  assert.ok(paid.consultation.callbackDeadline);

  const started = api.updateConsultationStatus(paid.consultation.id, "in_consultation");
  assert.equal(started.status, "in_consultation");
  assert.ok(started.startedAt);

  const completed = api.completeConsultation(paid.consultation.id, {
    medicines: "Paracetamol 500mg after food, twice daily for 3 days",
    advice: "Drink fluids and call back if fever continues after 48 hours.",
    followUpDate: "2026-05-14"
  });

  assert.equal(completed.consultation.status, "completed");
  assert.equal(completed.prescription.consultationId, paid.consultation.id);
  assert.equal(api.getPrescriptionByConsultation(paid.consultation.id)?.advice, completed.prescription.advice);
  assert.equal(api.listDoctorEarnings().length, 1);

  const feedback = api.addFeedback({ consultationId: paid.consultation.id, rating: 5, comment: "Doctor called quickly." });
  assert.equal(feedback.rating, 5);

  const dashboard = api.adminDashboard();
  assert.equal(dashboard.totalConsultations, 1);
  assert.equal(dashboard.completedConsultations, 1);
  assert.equal(dashboard.dailyRevenue, 4900);
  assert.equal(dashboard.completionRate, 100);
});

test("blocks emergency symptoms and records an audit trail", () => {
  const api = createDemoApi();

  const result = api.createConsultation({
    name: "Asha Devi",
    phone: "+919812345678",
    age: 41,
    gender: "female",
    city: "Kanpur",
    language: "Hindi",
    symptoms: "Chest pain and breathing difficulty",
    plan: "priority",
    consent: true
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "emergency_detected");
  assert.equal(result.emergency?.blocked, true);
  assert.equal(api.listAuditLogs()[0]?.action, "emergency_consultation_blocked");
});

test("manages doctors, organizations, and outbound notification records", () => {
  const api = createDemoApi();

  const doctor = api.createDoctor({
    name: "Dr. Neha Rao",
    phone: "+919900000001",
    city: "Agra",
    languages: ["Hindi", "English"],
    specialization: "General Physician",
    registrationNumber: "NMC-AG-22",
    consultationFee: 49
  });

  const offline = api.setDoctorAvailability(doctor.id, "offline");
  assert.equal(offline.availabilityStatus, "offline");

  const org = api.createOrganization({
    name: "Shakti Textiles",
    type: "factory",
    city: "Agra",
    contactPerson: "HR Manager",
    phone: "+919900000002",
    planId: "org_custom"
  });

  const member = api.addOrganizationMember(org.id, {
    name: "Pooja Singh",
    phone: "+919900000003",
    employeeCode: "ST-1001"
  });

  assert.equal(member.organizationId, org.id);
  assert.equal(api.getOrganization(org.id)?.memberCount, 1);

  const notification = api.sendNotification({
    channel: "whatsapp",
    phone: "+919900000003",
    template: "booking_started",
    language: "Hindi"
  });

  assert.equal(notification.status, "queued");
  assert.match(notification.message, /NeighborDoc/);

  // Test getDoctor
  const fetchedDoctor = api.getDoctor(doctor.id);
  assert.equal(fetchedDoctor?.name, "Dr. Neha Rao");
  assert.equal(fetchedDoctor?.registrationNumber, "NMC-AG-22");

  // Test webhook auto-assignment of paid consultation
  const consultation = api.createConsultation({
    name: "Sunil Verma",
    phone: "+919711223344",
    age: 29,
    gender: "male",
    city: "Lucknow",
    language: "Hindi",
    symptoms: "Mild headache",
    plan: "basic",
    consent: true
  });
  assert.equal(consultation.ok, true);

  const webhookResult = api.handlePaymentWebhook(
    JSON.stringify({ consultationId: consultation.consultation.id }),
    "signature_test"
  );
  assert.equal(webhookResult.ok, true);
  assert.equal(webhookResult.consultationUpdated, true);
  assert.equal(api.getConsultation(consultation.consultation.id)?.paymentStatus, "paid");
});

test("signs and verifies genuine JWT authorization tokens with role enforcement", () => {
  const token = createJwtToken({
    sub: "user_doc_101",
    phone: "+919800000001",
    role: "doctor",
    name: "Dr. Priya Sharma"
  });

  assert.ok(token);
  assert.equal(token.split(".").length, 3);

  const verified = verifyJwtToken(token);
  assert.equal(verified.valid, true);
  assert.equal(verified.payload?.role, "doctor");
  assert.equal(verified.payload?.phone, "+919800000001");

  // Tampered token test
  const tampered = token.slice(0, -5) + "abcde";
  const tamperedResult = verifyJwtToken(tampered);
  assert.equal(tamperedResult.valid, false);
});

test("initiates telephony click-to-call bridge with masked patient privacy", () => {
  const api = createDemoApi();
  const consultation = api.createConsultation({
    name: "Sunil Verma",
    phone: "+919711223344",
    age: 29,
    gender: "male",
    city: "Lucknow",
    language: "Hindi",
    symptoms: "Fever and mild body ache",
    plan: "basic",
    consent: true
  });
  assert.equal(consultation.ok, true);

  const bridge = api.initiateTelephonyBridge({
    consultationId: consultation.consultation.id,
    doctorPhone: "+919800000001"
  });

  assert.equal(bridge.status, "connected");
  assert.ok(bridge.maskedPatientPhone.includes("XXXX"));
  assert.equal(bridge.doctorPhone, "+919800000001");
});

