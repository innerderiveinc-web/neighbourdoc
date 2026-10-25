import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  callbackDeadline,
  detectEmergency,
  getConsultationPrice,
  selectDoctorForConsultation,
  validatePrescriptionDrugs,
  type ConsultationPlan,
  type ConsultationStatus,
  type DoctorCandidate,
  type Language,
  type SystemSettings,
  type UrgencyLevel,
  type UserRole
} from "@neighbourdoc/shared";

// ---------------------------------------------------------
// Domain Modular Exports (Clean Architecture / DDD)
// ---------------------------------------------------------
export * from "./types/index.ts";
export * from "./services/auth.service.ts";
export * from "./services/payment.service.ts";
export * from "./services/consultation.service.ts";
export * from "./services/notification.service.ts";
export * from "./store/defaults.ts";

import {
  type AuthTokenPayload,
  type CreateConsultationInput,
  type BookingInput,
  type PaymentOrder,
  type WhatsAppTemplate,
  type VerificationStatus,
  type AvailabilityStatus,
  type PaymentStatus,
  type NotificationChannel,
  type DemoUser,
  type DemoPatient,
  type DemoDoctor,
  type DemoConsultation,
  type Day3FollowUpReport,
  type SlaWatchdogAction,
  type SlaWatchdogReport,
  type DemoPayment,
  type DemoPrescription,
  type DemoEarning,
  type DemoOrganization,
  type DemoOrganizationMember,
  type DemoFeedback,
  type DemoReferral,
  type DemoAuditLog,
  type DemoNotification,
  type TelephonyBridge,
  type DemoContactTicket,
  type NeighbourDocState
} from "./types/index.ts";

import {
  getJwtSecret,
  createJwtToken,
  verifyJwtToken,
  sendOtp,
  verifyOtp
} from "./services/auth.service.ts";

import {
  createPaymentOrder,
  verifyRazorpaySignature
} from "./services/payment.service.ts";

import {
  canAccessConsultation,
  prepareConsultation
} from "./services/consultation.service.ts";

import {
  buildWhatsAppMessage
} from "./services/notification.service.ts";

import {
  getDefaultSettings,
  getInitialDoctors,
  getInitialUsers
} from "./store/defaults.ts";

const nowIso = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

// ---------------------------------------------------------
// Core Factory: Persistent Multi-Tenant API Engine
// ---------------------------------------------------------

export function createDemoApi(persistencePath?: string) {
  const isTestMode = process.env.NODE_ENV === "test";
  const defaultFilePath = path.join(process.cwd(), ".data", "neighbourdoc_state.json");
  const legacyFilePath = path.join(process.cwd(), ".data", "neighbordoc_state.json");
  const filePath =
    persistencePath === ":memory:" || (isTestMode && !persistencePath)
      ? null
      : persistencePath ?? (fs.existsSync(legacyFilePath) && !fs.existsSync(defaultFilePath) ? legacyFilePath : defaultFilePath);
  // Load state from file if exists
  let state: NeighbourDocState = {
    settings: getDefaultSettings(),
    users: getInitialUsers(),
    patients: [],
    doctors: getInitialDoctors(),
    consultations: [],
    payments: [],
    prescriptions: [],
    earnings: [],
    organizations: [],
    organizationMembers: [],
    feedbacks: [],
    referrals: [],
    auditLogs: [],
    notifications: [],
    telephonyBridges: []
  };

  try {
    if (filePath && fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.consultations)) {
        state = {
          ...state,
          ...parsed,
          settings: parsed.settings ? { ...getDefaultSettings(), ...parsed.settings } : getDefaultSettings(),
          // Ensure default seeded doctors and admin are always available
          doctors: parsed.doctors?.length ? parsed.doctors : getInitialDoctors(),
          users: parsed.users?.length ? parsed.users : getInitialUsers()
        };
      }
    }
  } catch (err) {
    // Graceful fallback to default in-memory state
  }

  // Debounced persistence flush to disk
  function saveState() {
    if (!filePath) return;
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8");
    } catch {
      // Disk persistence failure should not block transaction
    }
  }

  const toCandidate = (doctor: DemoDoctor): DoctorCandidate => ({
    id: doctor.id,
    city: doctor.city,
    languages: doctor.languages,
    verified: doctor.verificationStatus === "verified",
    available: doctor.availabilityStatus === "online",
    lastAssignedAt: doctor.lastAssignedAt
  });

  const findOrCreatePatient = (
    input: Pick<BookingInput, "name" | "phone" | "age" | "gender" | "city" | "locality" | "language">
  ) => {
    const existingUser = state.users.find((user) => user.phone === input.phone && user.role === "patient");
    if (existingUser) {
      const existingPatient = state.patients.find((patient) => patient.userId === existingUser.id);
      if (existingPatient) return { user: existingUser, patient: existingPatient };
    }

    const user: DemoUser = {
      id: id("user"),
      name: input.name,
      phone: input.phone,
      role: "patient",
      language: input.language,
      createdAt: nowIso()
    };
    const patient: DemoPatient = {
      id: id("patient"),
      userId: user.id,
      age: input.age,
      gender: input.gender,
      city: input.city,
      locality: input.locality
    };
    state.users.push(user);
    state.patients.push(patient);
    saveState();
    return { user, patient };
  };

  const assignDoctor = (consultationId: string) => {
    const consultation = state.consultations.find((item) => item.id === consultationId);
    if (!consultation) throw new Error("Consultation not found.");
    const patient = state.patients.find((item) => item.id === consultation.patientId);
    if (!patient) throw new Error("Patient not found.");
    const patientUser = state.users.find((item) => item.id === consultation.patientUserId);
    const selected = selectDoctorForConsultation(state.doctors.map(toCandidate), {
      city: patient.city,
      language: patientUser?.language ?? "Hindi"
    });

    if (!selected) {
      consultation.status = consultation.paymentStatus === "paid" ? "queued" : "payment_pending";
      saveState();
      return consultation;
    }

    const doctor = state.doctors.find((item) => item.id === selected.id);
    if (!doctor) throw new Error("Selected doctor not found.");
    const assignedAt = nowIso();
    doctor.lastAssignedAt = assignedAt;
    consultation.doctorId = doctor.id;
    consultation.doctorUserId = doctor.userId;
    consultation.status = "assigned";
    const slaMinutes = state.settings?.slaCallbackMinutes ?? 15;
    consultation.callbackDeadline = callbackDeadline(new Date(assignedAt), slaMinutes).toISOString();

    const notif = {
      id: id("notification"),
      channel: "whatsapp" as const,
      phone: patientUser?.phone ?? "",
      template: "doctor_assigned" as const,
      language: patientUser?.language === "English" ? ("English" as const) : ("Hindi" as const),
      message: buildWhatsAppMessage("doctor_assigned", patientUser?.language === "English" ? "English" : "Hindi"),
      status: "queued" as const,
      createdAt: nowIso()
    };
    state.notifications.push(notif);
    saveState();
    return consultation;
  };

  const api = {
    getState() {
      return state;
    },
    sendOtp,
    verifyOtp(input: VerifyOtpInput) {
      const cleanPhone = input.phone.trim();
      const existingUser = state.users.find((u) => u.phone === cleanPhone);
      const existingDoctor = state.doctors.find((d) => d.phone === cleanPhone);
      return verifyOtp(input, {
        id: existingUser?.id ?? (existingDoctor ? existingDoctor.userId : undefined),
        role: existingUser?.role ?? (existingDoctor ? "doctor" : undefined),
        name: existingUser?.name ?? existingDoctor?.name,
        doctorId: existingDoctor?.id
      });
    },
    logout() {
      return { ok: true as const };
    },
    getPatientMe(userId: string) {
      if (!userId) {
        return { user: null, patient: null };
      }
      const user = state.users.find((item) => item.id === userId);
      const patient = state.patients.find((item) => item.userId === userId);
      return { user: user ?? null, patient: patient ?? null };
    },
    updatePatientMe(userId: string, patch: Partial<DemoPatient & Pick<DemoUser, "name" | "email" | "language">>) {
      if (!userId) throw new Error("userId is required.");
      const user = state.users.find((item) => item.id === userId);
      const patient = state.patients.find((item) => item.userId === userId);
      if (!user || !patient) throw new Error("Patient profile not found.");
      Object.assign(user, {
        name: patch.name ?? user.name,
        email: patch.email ?? user.email,
        language: patch.language ?? user.language
      });
      Object.assign(patient, patch);
      saveState();
      return { user, patient };
    },
    anonymizePatientData(userId: string, actor: AuthTokenPayload) {
      if (!userId) throw new Error("userId is required.");
      const isAdmin = actor.role === "admin" || actor.role === "superadmin";
      if (!isAdmin && actor.sub !== userId) {
        throw new Error("Forbidden: You cannot erase another patient's data.");
      }

      const user = state.users.find((item) => item.id === userId);
      const patient = state.patients.find((item) => item.userId === userId);
      if (!user && !patient) throw new Error("Patient not found.");

      if (user) {
        user.name = "Anonymized Patient";
        user.phone = "+910000000000";
        delete user.email;
      }

      if (patient) {
        patient.city = "Redacted";
        patient.locality = "Redacted";
      }

      state.auditLogs.push({
        id: id("audit"),
        actorId: actor.sub,
        action: "patient_data_erasure_executed",
        entityType: "patient",
        entityId: userId,
        metadata: { requestedBy: actor.sub, role: actor.role },
        createdAt: nowIso()
      });

      saveState();
      return { ok: true, message: "Patient data successfully anonymized in compliance with DPDP Act 2023." };
    },
    listDoctors() {
      return state.doctors;
    },
    getDoctor(doctorId: string) {
      return state.doctors.find((item) => item.id === doctorId || item.userId === doctorId) ?? null;
    },
    createDoctor(input: {
      name: string;
      phone: string;
      city: string;
      languages: Language[];
      specialization: string;
      registrationNumber: string;
      consultationFee: number;
      qualification?: string;
    }) {
      const user: DemoUser = {
        id: id("user"),
        name: input.name,
        phone: input.phone,
        role: "doctor",
        language: input.languages[0] ?? "Hindi",
        createdAt: nowIso()
      };
      const doctor: DemoDoctor = {
        id: id("doctor"),
        userId: user.id,
        name: input.name,
        phone: input.phone,
        city: input.city,
        languages: input.languages,
        registrationNumber: input.registrationNumber,
        qualification: input.qualification ?? "MBBS",
        specialization: input.specialization,
        verificationStatus: "pending", // Starts as pending - requires administrative document review
        availabilityStatus: "offline", // Offline until verified
        consultationFee: input.consultationFee,
        payoutShare: 30,
        callsToday: 0,
        rating: 0,
        earnedToday: 0,
        lastAssignedAt: null,
        createdAt: nowIso()
      };
      state.users.push(user);
      state.doctors.push(doctor);
      state.auditLogs.push({
        id: id("audit"),
        action: "doctor_registration_submitted",
        entityType: "doctor",
        entityId: doctor.id,
        metadata: { name: doctor.name, registrationNumber: doctor.registrationNumber },
        createdAt: nowIso()
      });
      saveState();
      return doctor;
    },
    verifyDoctor(doctorId: string, adminActor: AuthTokenPayload, notes?: string) {
      if (adminActor.role !== "admin" && adminActor.role !== "superadmin") {
        throw new Error("Forbidden: Only an administrator can verify clinician credentials.");
      }
      const doctor = state.doctors.find((item) => item.id === doctorId);
      if (!doctor) throw new Error("Doctor not found.");
      doctor.verificationStatus = "verified";
      doctor.availabilityStatus = "online";
      state.auditLogs.push({
        id: id("audit"),
        actorId: adminActor.sub,
        action: "doctor_verification_approved",
        entityType: "doctor",
        entityId: doctor.id,
        metadata: { notes, verifiedBy: adminActor.sub },
        createdAt: nowIso()
      });
      saveState();
      return doctor;
    },
    updateDoctor(doctorId: string, patch: Partial<DemoDoctor>, actor?: AuthTokenPayload) {
      const doctor = state.doctors.find((item) => item.id === doctorId);
      if (!doctor) throw new Error("Doctor not found.");

      if (actor) {
        const isAdmin = actor.role === "admin" || actor.role === "superadmin";
        const isSelf = doctor.userId === actor.sub || doctor.id === actor.doctorId;

        if (!isAdmin && !isSelf) {
          throw new Error("Forbidden: You cannot modify another doctor's profile.");
        }

        // Clinicians cannot self-approve verification or alter financial splits
        if (!isAdmin) {
          delete patch.verificationStatus;
          delete patch.payoutShare;
          delete patch.earnedToday;
          delete patch.callsToday;
        }
      }

      Object.assign(doctor, patch);
      saveState();
      return doctor;
    },
    setDoctorAvailability(doctorId: string, availabilityStatus: AvailabilityStatus, actor?: AuthTokenPayload) {
      const doctor = state.doctors.find((item) => item.id === doctorId);
      if (!doctor) throw new Error("Doctor not found.");

      if (actor) {
        const isAdmin = actor.role === "admin" || actor.role === "superadmin";
        const isSelf = doctor.userId === actor.sub || doctor.id === actor.doctorId;
        if (!isAdmin && !isSelf) {
          throw new Error("Forbidden: You cannot modify availability status for another clinician.");
        }
      }

      doctor.availabilityStatus = availabilityStatus;
      saveState();
      return doctor;
    },
    createConsultation(input: BookingInput) {
      if (!input.consent) return { ok: false as const, reason: "consent_required", error: "Consent is required." };

      const emergency = detectEmergency(input.symptoms);
      const { user, patient } = findOrCreatePatient(input);
      if (emergency.blocked) {
        state.auditLogs.push({
          id: id("audit"),
          actorId: user.id,
          action: "emergency_consultation_blocked",
          entityType: "consultation",
          metadata: { matchedTerms: emergency.matchedTerms, symptoms: input.symptoms },
          createdAt: nowIso()
        });
        saveState();
        return { ok: false as const, reason: "emergency_detected", emergency };
      }

      const basePrice = getConsultationPrice(input.plan);
      const configuredAmount =
        input.plan === "basic" && state.settings?.basicConsultationFee
          ? state.settings.basicConsultationFee * 100
          : input.plan === "priority" && state.settings?.priorityConsultationFee
          ? state.settings.priorityConsultationFee * 100
          : basePrice.amount;
      const price = { ...basePrice, amount: configuredAmount };

      const consultation: DemoConsultation = {
        id: id("consultation"),
        patientId: patient.id,
        patientUserId: user.id,
        doctorId: null,
        doctorUserId: null,
        organizationId: input.organizationId,
        plan: input.plan,
        amount: price.amount,
        symptoms: input.symptoms,
        existingIllnesses: input.existingIllnesses,
        urgencyLevel: emergency.urgencyLevel,
        status: "payment_pending",
        paymentStatus: "pending",
        callbackDeadline: null,
        startedAt: null,
        completedAt: null,
        consentAt: nowIso(),
        referralSource: input.referralSource,
        createdAt: nowIso()
      };
      state.consultations.push(consultation);
      state.notifications.push({
        id: id("notification"),
        channel: "whatsapp",
        phone: input.phone,
        template: "booking_started",
        language: input.language === "English" ? "English" : "Hindi",
        message: buildWhatsAppMessage("booking_started", input.language === "English" ? "English" : "Hindi"),
        status: "queued",
        createdAt: nowIso()
      });
      saveState();
      const sessionToken = createJwtToken({
        sub: user.id,
        phone: user.phone,
        role: "patient",
        name: user.name
      });
      return { ok: true as const, consultation, patient, price, sessionToken };
    },
    createPaymentOrder(input: { plan: ConsultationPlan; consultationId?: string; patientId?: string }) {
      const order = createPaymentOrder(input.plan);
      const configuredAmount =
        input.plan === "basic" && state.settings?.basicConsultationFee
          ? state.settings.basicConsultationFee * 100
          : input.plan === "priority" && state.settings?.priorityConsultationFee
          ? state.settings.priorityConsultationFee * 100
          : order.amount;
      order.amount = configuredAmount;

      state.payments.push({
        id: id("payment"),
        consultationId: input.consultationId,
        patientId: input.patientId,
        amount: order.amount,
        gateway: "razorpay",
        gatewayOrderId: order.orderId,
        status: "pending",
        createdAt: nowIso()
      });
      saveState();
      return order;
    },
    verifyPayment(input: {
      consultationId: string;
      orderId: string;
      gatewayPaymentId: string;
      signature?: string;
    }) {
      const consultation = state.consultations.find((item) => item.id === input.consultationId);
      if (!consultation) return { ok: false as const, error: "Consultation not found." };

      // IDEMPOTENCY: If consultation is already paid, return existing payment record immediately
      if (consultation.paymentStatus === "paid") {
        const existingPayment = state.payments.find(
          (p) => p.consultationId === input.consultationId && p.status === "paid"
        );
        return {
          ok: true as const,
          consultation,
          payment: existingPayment,
          alreadyProcessed: true
        };
      }

      const secret = process.env.RAZORPAY_KEY_SECRET;
      let verificationMethod: DemoPayment["verificationMethod"] = "razorpay_hmac_verified";

      if (input.signature) {
        if (!secret) {
          return {
            ok: false as const,
            error: "Payment gateway configuration error: RAZORPAY_KEY_SECRET is missing on server."
          };
        }
        const payload = `${input.orderId}|${input.gatewayPaymentId}`;
        const isVerified = verifyRazorpaySignature(payload, input.signature, secret);
        if (!isVerified) {
          return { ok: false as const, error: "Cryptographic signature mismatch: payment verification failed." };
        }
      } else {
        const allowSimulation =
          process.env.ALLOW_PAYMENT_SIMULATION === "true" ||
          (process.env.NODE_ENV !== "production" && !process.env.RAZORPAY_KEY_SECRET);
        if (!allowSimulation) {
          return {
            ok: false as const,
            error: "Payment verification requires an authentic gateway signature in production."
          };
        }
        verificationMethod = "sandbox_simulated";
      }

      const payment = state.payments.find((item) => item.gatewayOrderId === input.orderId) ?? {
        id: id("payment"),
        consultationId: input.consultationId,
        patientId: consultation.patientId,
        amount: consultation.amount,
        gateway: "razorpay" as const,
        gatewayOrderId: input.orderId,
        status: "pending" as const,
        createdAt: nowIso()
      };

      if (!state.payments.includes(payment)) state.payments.push(payment);
      payment.gatewayPaymentId = input.gatewayPaymentId;
      payment.gatewaySignature = input.signature;
      payment.verificationMethod = verificationMethod;
      payment.status = "paid";

      consultation.paymentStatus = "paid";
      consultation.paidAt = nowIso();
      consultation.status = "paid";
      const assigned = assignDoctor(consultation.id);
      const patientUser = state.users.find((item) => item.id === consultation.patientUserId);

      state.notifications.push({
        id: id("notification"),
        channel: "whatsapp",
        phone: patientUser?.phone ?? "",
        template: "payment_successful",
        language: patientUser?.language === "English" ? "English" : "Hindi",
        message: buildWhatsAppMessage("payment_successful", patientUser?.language === "English" ? "English" : "Hindi"),
        status: "queued",
        createdAt: nowIso()
      });

      saveState();
      return { ok: true as const, consultation: assigned, payment };
    },
    handlePaymentWebhook(payload: string, signature: string) {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!secret && process.env.NODE_ENV === "production") {
        return { ok: false, error: "RAZORPAY_WEBHOOK_SECRET is not configured on server." };
      }

      const verified = secret
        ? verifyRazorpaySignature(payload, signature, secret)
        : process.env.NODE_ENV !== "production";
      if (!verified) {
        return { ok: false, error: "Invalid webhook cryptographic signature." };
      }

      let consultationUpdated = false;
      let eventId: string | undefined;

      try {
        const body = JSON.parse(payload);
        eventId = body?.event_id ?? body?.id;

        // Idempotency: prevent replay attack
        if (eventId && state.processedWebhookEventIds?.includes(eventId)) {
          return { ok: true, alreadyProcessed: true };
        }

        const consultationId =
          body?.payload?.payment?.entity?.notes?.consultationId || body?.consultationId;
        if (consultationId) {
          const c = state.consultations.find((item) => item.id === consultationId);
          if (c && c.paymentStatus !== "paid") {
            c.paymentStatus = "paid";
            c.status = "queued";
            assignDoctor(consultationId);
            consultationUpdated = true;
          }
        }
      } catch {}

      if (eventId) {
        if (!state.processedWebhookEventIds) state.processedWebhookEventIds = [];
        state.processedWebhookEventIds.push(eventId);
      }

      state.auditLogs.push({
        id: id("audit"),
        action: "payment_webhook_processed",
        entityType: "payment",
        metadata: { verified: true, consultationUpdated, eventId },
        createdAt: nowIso()
      });
      saveState();
      return { ok: true, consultationUpdated };
    },
    assignDoctor,
    listConsultations(actor?: AuthTokenPayload) {
      if (!actor) return [];
      if (actor.role === "admin" || actor.role === "superadmin") {
        return state.consultations;
      }
      if (actor.role === "doctor") {
        return state.consultations.filter(
          (c) =>
            (c.doctorId && actor.doctorId && c.doctorId === actor.doctorId) ||
            (c.doctorUserId && c.doctorUserId === actor.sub) ||
            (c.doctorId && c.doctorId === actor.sub)
        );
      }
      if (actor.role === "patient") {
        return state.consultations.filter((c) => c.patientUserId === actor.sub);
      }
      if (actor.role === "partner") {
        return state.consultations.filter(
          (c) => actor.organizationId && c.organizationId === actor.organizationId
        );
      }
      return [];
    },
    getConsultation(consultationId: string, actor?: AuthTokenPayload) {
      const consultation = state.consultations.find((item) => item.id === consultationId) ?? null;
      if (!consultation) return null;
      if (actor && !canAccessConsultation(actor, consultation)) {
        return null;
      }
      return consultation;
    },
    updateConsultationStatus(consultationId: string, status: ConsultationStatus) {
      const consultation = state.consultations.find((item) => item.id === consultationId);
      if (!consultation) throw new Error("Consultation not found.");
      consultation.status = status;
      if (status === "in_consultation" && !consultation.startedAt) consultation.startedAt = nowIso();
      if (status === "completed" && !consultation.completedAt) consultation.completedAt = nowIso();
      saveState();
      return consultation;
    },
    createPrescription(
      input: Omit<DemoPrescription, "id" | "doctorId" | "createdAt"> & { doctorId?: string }
    ) {
      const consultation = state.consultations.find((item) => item.id === input.consultationId);
      if (!consultation) throw new Error("Consultation not found.");

      const existing = state.prescriptions.find((p) => p.consultationId === input.consultationId);
      if (existing) {
        existing.medicines = input.medicines;
        existing.advice = input.advice;
        if (input.followUpDate) existing.followUpDate = input.followUpDate;
        if (input.fileUrl) existing.fileUrl = input.fileUrl;
        saveState();
        return existing;
      }

      const prescription: DemoPrescription = {
        id: id("prescription"),
        consultationId: input.consultationId,
        doctorId: input.doctorId ?? consultation.doctorId ?? "doctor_unassigned",
        medicines: input.medicines,
        advice: input.advice,
        followUpDate: input.followUpDate,
        fileUrl: input.fileUrl,
        createdAt: nowIso()
      };
      state.prescriptions.push(prescription);
      saveState();
      return prescription;
    },
    completeConsultation(
      consultationId: string,
      prescriptionInput: Pick<DemoPrescription, "medicines" | "advice" | "followUpDate" | "fileUrl">,
      actor?: AuthTokenPayload
    ) {
      const consultation = state.consultations.find((item) => item.id === consultationId);
      if (!consultation) throw new Error("Consultation not found.");

      if (actor) {
        const isAdmin = actor.role === "admin" || actor.role === "superadmin";
        const isAssignedDoctor =
          consultation.doctorId &&
          (consultation.doctorId === actor.doctorId ||
            consultation.doctorUserId === actor.sub ||
            consultation.doctorId === actor.sub);
        if (!isAdmin && !isAssignedDoctor) {
          throw new Error("Forbidden: You are not authorized to complete this consultation.");
        }
      }

      // STATUTORY COMPLIANCE: Telemedicine Practice Guidelines (2020) Drug Scheduling Verification
      const drugValidation = validatePrescriptionDrugs(prescriptionInput.medicines);
      if (!drugValidation.isCompliant) {
        throw new Error(drugValidation.warningMessage ?? "Prohibited substances detected under Telemedicine Practice Guidelines (2020).");
      }

      // IDEMPOTENCY: If already completed, return existing prescription and earning without duplicate payouts
      if (consultation.status === "completed") {
        const existingPrescription = state.prescriptions.find((item) => item.consultationId === consultationId);
        const existingEarning = state.earnings.find((item) => item.consultationId === consultationId);
        return {
          consultation,
          prescription: existingPrescription,
          earning: existingEarning,
          alreadyCompleted: true
        };
      }

      const prescription = api.createPrescription({ consultationId, ...prescriptionInput });
      consultation.status = "completed";
      consultation.completedAt = nowIso();
      const payoutAmountPaise = (state.settings?.doctorPayoutShare ?? 30) * 100;
      const earning: DemoEarning = {
        id: id("earning"),
        doctorId: consultation.doctorId ?? "doctor_unassigned",
        consultationId,
        amount: payoutAmountPaise,
        payoutStatus: "pending",
        createdAt: nowIso()
      };
      state.earnings.push(earning);
      const doctor = state.doctors.find((item) => item.id === consultation.doctorId);
      if (doctor) {
        doctor.callsToday += 1;
        doctor.earnedToday += earning.amount / 100;
      }
      const patientUser = state.users.find((item) => item.id === consultation.patientUserId);
      state.notifications.push({
        id: id("notification"),
        channel: "whatsapp",
        phone: patientUser?.phone ?? "",
        template: "prescription_ready",
        language: patientUser?.language === "English" ? "English" : "Hindi",
        message: buildWhatsAppMessage("prescription_ready", patientUser?.language === "English" ? "English" : "Hindi"),
        status: "queued",
        createdAt: nowIso()
      });
      saveState();
      return { consultation, prescription, earning };
    },
    getPrescriptionByConsultation(consultationId: string, actor?: AuthTokenPayload) {
      const consultation = state.consultations.find((item) => item.id === consultationId);
      if (!consultation) return null;
      if (actor && !canAccessConsultation(actor, consultation)) {
        return null;
      }
      const prescription = state.prescriptions.find((item) => item.consultationId === consultationId) ?? null;
      if (prescription && actor) {
        state.auditLogs.push({
          id: id("audit"),
          actorId: actor.sub,
          action: "prescription_accessed",
          entityType: "prescription",
          entityId: prescription.id,
          metadata: { consultationId, role: actor.role },
          createdAt: nowIso()
        });
        saveState();
      }
      return prescription;
    },
    executeRefund(consultationId: string, actor: AuthTokenPayload, reason: string) {
      if (actor.role !== "admin" && actor.role !== "superadmin") {
        throw new Error("Forbidden: Only administrators can execute refunds.");
      }

      const consultation = state.consultations.find((c) => c.id === consultationId);
      if (!consultation) throw new Error("Consultation not found.");

      if (consultation.paymentStatus !== "paid") {
        throw new Error(`Cannot refund consultation with payment status '${consultation.paymentStatus}'.`);
      }

      consultation.status = "refunded";
      consultation.paymentStatus = "refunded";

      const payment = state.payments.find((p) => p.consultationId === consultationId);
      if (payment) {
        payment.status = "refunded";
      }

      const earning = state.earnings.find((e) => e.consultationId === consultationId);
      if (earning && earning.payoutStatus === "pending") {
        earning.payoutStatus = "held";
      }

      const patientUser = state.users.find((u) => u.id === consultation.patientUserId);

      state.auditLogs.push({
        id: id("audit"),
        actorId: actor.sub,
        action: "consultation_refund_executed",
        entityType: "consultation",
        entityId: consultationId,
        metadata: { reason, amount: consultation.amount, refundedBy: actor.sub },
        createdAt: nowIso()
      });

      const isSlaBreach = reason.startsWith("SLA_BREACH");
      const notifLanguage = patientUser?.language === "English" ? "English" : "Hindi";
      const notifMessage = isSlaBreach
        ? buildWhatsAppMessage("sla_breach_apology", notifLanguage)
        : `Namaste! Your consultation fee of ₹${consultation.amount / 100} has been refunded. Reason: ${reason}. For queries, contact support@neighbourdoc.in`;

      state.notifications.push({
        id: id("notification"),
        channel: "whatsapp",
        phone: patientUser?.phone ?? "",
        template: isSlaBreach ? "sla_breach_apology" : "refund_processed",
        language: notifLanguage,
        message: notifMessage,
        status: "queued",
        createdAt: nowIso()
      });

      saveState();
      return { ok: true as const, consultation, payment };
    },
    reassignDoctor(consultationId: string, reason: string = "SLA_ESCALATION_DOCTOR_TIMEOUT") {
      const consultation = state.consultations.find((item) => item.id === consultationId);
      if (!consultation) throw new Error("Consultation not found.");
      const patient = state.patients.find((item) => item.id === consultation.patientId);
      if (!patient) throw new Error("Patient not found.");
      const patientUser = state.users.find((item) => item.id === consultation.patientUserId);

      // Filter out the currently assigned doctor to find a fresh clinician
      const candidates = state.doctors
        .filter((d) => d.id !== consultation.doctorId)
        .map(toCandidate);

      const selected = selectDoctorForConsultation(candidates, {
        city: patient.city,
        language: patientUser?.language ?? "Hindi"
      });

      if (!selected) {
        return null;
      }

      const prevDoctorId = consultation.doctorId;
      const newDoctor = state.doctors.find((item) => item.id === selected.id);
      if (!newDoctor) return null;

      const assignedAt = nowIso();
      newDoctor.lastAssignedAt = assignedAt;
      consultation.doctorId = newDoctor.id;
      consultation.doctorUserId = newDoctor.userId;
      consultation.status = "assigned";

      const slaMinutes = state.settings?.slaCallbackMinutes ?? 15;
      consultation.callbackDeadline = callbackDeadline(new Date(assignedAt), slaMinutes).toISOString();

      const newDoctorUser = state.users.find((u) => u.id === newDoctor.userId);

      // Audit log
      state.auditLogs.push({
        id: id("audit"),
        actorId: "system_sla_watchdog",
        action: "sla_watchdog_doctor_escalation_reassigned",
        entityType: "consultation",
        entityId: consultationId,
        metadata: { prevDoctorId, newDoctorId: newDoctor.id, reason },
        createdAt: assignedAt
      });

      // Dispatch urgent escalation WhatsApp to new doctor
      if (newDoctorUser?.phone) {
        state.notifications.push({
          id: id("notification"),
          channel: "whatsapp",
          phone: newDoctorUser.phone,
          template: "doctor_escalation_alert",
          language: "Hindi",
          message: buildWhatsAppMessage("doctor_escalation_alert", "Hindi"),
          status: "queued",
          createdAt: assignedAt
        });
      }

      saveState();
      return { consultation, newDoctor, prevDoctorId };
    },
    runSlaWatchdogCycle(options?: { customNow?: Date; autoRefundAdminActor?: AuthTokenPayload }) {
      const now = options?.customNow ?? new Date();
      const nowMs = now.getTime();
      const adminActor = options?.autoRefundAdminActor ?? {
        sub: "system_sla_watchdog",
        role: "admin" as const,
        language: "English" as const
      };

      const report: SlaWatchdogReport = {
        timestamp: now.toISOString(),
        totalActiveConsultations: 0,
        healthyCount: 0,
        escalatedCount: 0,
        autoRefundedCount: 0,
        actions: []
      };

      // Scan all paid consultations that have not completed or refunded
      const activeConsultations = state.consultations.filter(
        (c) =>
          c.paymentStatus === "paid" &&
          (c.status === "paid" || c.status === "assigned" || c.status === "queued") &&
          c.status !== "completed" &&
          c.status !== "refunded"
      );

      report.totalActiveConsultations = activeConsultations.length;

      for (const consultation of activeConsultations) {
        // Calculate elapsed time from paidAt or createdAt
        const refTimeStr = consultation.paidAt || consultation.createdAt;
        const referenceTime = refTimeStr ? new Date(refTimeStr).getTime() : nowMs;
        const elapsedMs = Math.max(0, nowMs - referenceTime);
        const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));

        // Threshold 1: >= 15 Minutes -> Autonomous SLA Breach Auto-Refund
        if (elapsedMinutes >= 15) {
          try {
            api.executeRefund(consultation.id, adminActor, "SLA_BREACH_15MIN_AUTOREFUND");
            consultation.cancellationReason = "SLA_BREACH_15MIN_AUTOREFUND";
            report.autoRefundedCount += 1;
            report.actions.push({
              consultationId: consultation.id,
              action: "auto_refunded",
              elapsedMinutes,
              details: `Auto-refunded ₹${consultation.amount / 100} due to 15-minute SLA breach.`
            });
          } catch (err: any) {
            report.actions.push({
              consultationId: consultation.id,
              action: "auto_refunded",
              elapsedMinutes,
              details: `Refund error: ${err.message}`
            });
          }
          continue;
        }

        // Threshold 2: >= 8 Minutes & < 15 Minutes -> Autonomous Escalation & Clinician Reassignment
        if (elapsedMinutes >= 8) {
          const reassignResult = api.reassignDoctor(consultation.id, "SLA_ESCALATION_8MIN_TIMEOUT");
          if (reassignResult) {
            report.escalatedCount += 1;
            report.actions.push({
              consultationId: consultation.id,
              action: "escalated_reassigned",
              elapsedMinutes,
              details: `Escalated and reassigned from Dr. ${reassignResult.prevDoctorId} to Dr. ${reassignResult.newDoctor.id}.`
            });
          } else {
            report.healthyCount += 1;
            report.actions.push({
              consultationId: consultation.id,
              action: "healthy",
              elapsedMinutes,
              details: `Approaching SLA limit (${elapsedMinutes}m elapsed), no alternate clinician online.`
            });
          }
          continue;
        }

        // Within normal SLA limit (< 8 minutes)
        report.healthyCount += 1;
        report.actions.push({
          consultationId: consultation.id,
          action: "healthy",
          elapsedMinutes,
          details: `Normal SLA progress (${elapsedMinutes}m elapsed).`
        });
      }

      saveState();
      return report;
    },
    runDay3FollowUpAgentCycle(options?: { customNow?: Date }) {
      const now = options?.customNow ?? new Date();
      const nowMs = now.getTime();

      const report: Day3FollowUpReport = {
        timestamp: now.toISOString(),
        eligibleCompletedConsultations: 0,
        remindersSentCount: 0,
        consultationIds: []
      };

      const eligible = state.consultations.filter((c) => {
        if (c.status !== "completed" || !c.completedAt) return false;
        if (c.followUpSentAt) return false;
        const completedTime = new Date(c.completedAt).getTime();
        const elapsedMs = nowMs - completedTime;
        // Eligible if at least 48 hours have passed since consultation completion
        return elapsedMs >= 48 * 60 * 60 * 1000;
      });

      report.eligibleCompletedConsultations = eligible.length;

      for (const consultation of eligible) {
        consultation.followUpSentAt = now.toISOString();
        consultation.followUpStatus = "sent";

        const patientUser = state.users.find((u) => u.id === consultation.patientUserId);
        const language = patientUser?.language === "English" ? "English" : "Hindi";

        state.notifications.push({
          id: id("notification"),
          channel: "whatsapp",
          phone: patientUser?.phone ?? "",
          template: "follow_up_reminder",
          language,
          message: buildWhatsAppMessage("follow_up_reminder", language),
          status: "queued",
          createdAt: now.toISOString()
        });

        state.auditLogs.push({
          id: id("audit"),
          actorId: "system_day3_followup_agent",
          action: "day3_followup_reminder_sent",
          entityType: "consultation",
          entityId: consultation.id,
          metadata: { patientUserId: consultation.patientUserId, completedAt: consultation.completedAt },
          createdAt: now.toISOString()
        });

        report.remindersSentCount += 1;
        report.consultationIds.push(consultation.id);
      }

      saveState();
      return report;
    },
    recordFollowUpResponse(
      consultationId: string,
      input: { responseCode: "1" | "2" | "3" | 1 | 2 | 3; notes?: string }
    ) {
      const consultation = state.consultations.find((item) => item.id === consultationId);
      if (!consultation) throw new Error("Consultation not found.");

      const codeStr = String(input.responseCode).trim();
      const now = nowIso();
      consultation.followUpResponseAt = now;
      if (input.notes) consultation.followUpResponseNotes = input.notes;

      const patientUser = state.users.find((u) => u.id === consultation.patientUserId);
      const isEnglish = patientUser?.language === "English";

      let feedbackReply = "";
      let outcome: "recovered" | "mild_symptoms" | "worsened_escalated";

      if (codeStr === "1") {
        outcome = "recovered";
        consultation.followUpStatus = "recovered";
        feedbackReply = isEnglish
          ? "Thank you for the update! We are delighted to hear you are fully recovered. NeighbourDoc wishes you and your family good health."
          : "धन्यवाद! आपकी सेहत सुधरने पर हमें बेहद खुशी है। NeighbourDoc आपके और आपके परिवार के उत्तम स्वास्थ्य की सदैव कामना करता है।";
      } else if (codeStr === "2") {
        outcome = "mild_symptoms";
        consultation.followUpStatus = "mild_symptoms";
        feedbackReply = isEnglish
          ? "Please ensure you finish the prescribed course of medication as directed by the doctor. If symptoms persist beyond 24 hours, feel free to book a review."
          : "कृपया डॉक्टर द्वारा बताए गए पर्चे की दवाइयां व पूरा कोर्स समय पर लें। 24 घंटे में सुधार न होने पर दोबारा निःसंकोच परामर्श लें।";
      } else {
        outcome = "worsened_escalated";
        consultation.followUpStatus = "worsened_escalated";
        consultation.status = "escalated";

        // Notify assigned doctor about worsening condition
        const doctor = state.doctors.find((d) => d.id === consultation.doctorId);
        const doctorUser = state.users.find((u) => u.id === doctor?.userId);
        if (doctorUser?.phone) {
          state.notifications.push({
            id: id("notification"),
            channel: "whatsapp",
            phone: doctorUser.phone,
            template: "follow_up_escalation_alert",
            language: "Hindi",
            message: buildWhatsAppMessage("follow_up_escalation_alert", "Hindi"),
            status: "queued",
            createdAt: now
          });
        }

        feedbackReply = isEnglish
          ? "⚠️ Your condition has been escalated with priority. Our clinical team is arranging a free review call with the doctor. If you experience severe chest pain, breathlessness, or collapse, please call 112 immediately."
          : "⚠️ आपकी स्थिति को प्राथमिकता सूची में दर्ज कर लिया गया है। डॉक्टर साहब से आपकी निःशुल्क फॉलो-अप बातचीत कराई जा रही है। यदि सांस लेने में तकलीफ़ या सीने में दर्द हो, तो तुरंत आपातकालीन हेल्पलाइन 112 पर संपर्क करें।";
      }

      state.notifications.push({
        id: id("notification"),
        channel: "whatsapp",
        phone: patientUser?.phone ?? "",
        template: "follow_up_reminder",
        language: isEnglish ? "English" : "Hindi",
        message: feedbackReply,
        status: "queued",
        createdAt: now
      });

      state.auditLogs.push({
        id: id("audit"),
        actorId: consultation.patientUserId || "patient",
        action: "day3_followup_response_received",
        entityType: "consultation",
        entityId: consultation.id,
        metadata: { responseCode: codeStr, outcome, notes: input.notes },
        createdAt: now
      });

      saveState();
      return { ok: true as const, outcome, feedbackReply, consultation };
    },
    createContactTicket(input: { name: string; phone: string; message: string }) {
      if (!input.name || !input.phone || !input.message) {
        throw new Error("Name, phone, and message are required.");
      }
      const ticket: DemoContactTicket = {
        id: id("ticket"),
        name: input.name.trim(),
        phone: input.phone.trim(),
        message: input.message.trim(),
        status: "open",
        createdAt: nowIso()
      };
      if (!state.contactTickets) state.contactTickets = [];
      state.contactTickets.push(ticket);
      state.auditLogs.push({
        id: id("audit"),
        action: "contact_ticket_created",
        entityType: "support",
        entityId: ticket.id,
        metadata: { name: ticket.name, phone: ticket.phone },
        createdAt: nowIso()
      });
      saveState();
      return { ok: true as const, ticketId: ticket.id };
    },
    listDoctorEarnings() {
      return state.earnings;
    },
    addFeedback(input: { consultationId: string; rating: number; comment?: string }) {
      const feedback: DemoFeedback = { id: id("feedback"), ...input, createdAt: nowIso() };
      state.feedbacks.push(feedback);
      saveState();
      return feedback;
    },
    createOrganization(input: Omit<DemoOrganization, "id" | "memberCount" | "createdAt">) {
      const organization: DemoOrganization = { id: id("org"), ...input, memberCount: 0, createdAt: nowIso() };
      state.organizations.push(organization);
      saveState();
      return organization;
    },
    getOrganization(organizationId: string) {
      return state.organizations.find((item) => item.id === organizationId) ?? null;
    },
    addOrganizationMember(
      organizationId: string,
      input: { name: string; phone: string; employeeCode: string; age?: number; gender?: string },
      actor?: AuthTokenPayload
    ) {
      if (actor) {
        if (actor.role === "partner" && actor.organizationId !== organizationId) {
          throw new Error("Forbidden: You cannot manage members for another organization.");
        }
      }
      const organization = state.organizations.find((item) => item.id === organizationId);
      if (!organization) throw new Error("Organization not found.");
      const { patient } = findOrCreatePatient({
        name: input.name,
        phone: input.phone,
        age: input.age ?? 30,
        gender: input.gender ?? "not_specified",
        city: organization.city,
        language: "Hindi"
      });
      const member: DemoOrganizationMember = {
        id: id("org_member"),
        organizationId,
        patientId: patient.id,
        employeeCode: input.employeeCode,
        createdAt: nowIso()
      };
      state.organizationMembers.push(member);
      organization.memberCount += 1;
      saveState();
      return member;
    },
    createReferral(input: Omit<DemoReferral, "id" | "rewardStatus" | "createdAt">) {
      const referral: DemoReferral = { id: id("referral"), ...input, rewardStatus: "pending", createdAt: nowIso() };
      state.referrals.push(referral);
      saveState();
      return referral;
    },
    adminDashboard() {
      const paid = state.consultations.filter((item) => item.paymentStatus === "paid");
      const completed = state.consultations.filter((item) => item.status === "completed");
      const assigned = state.consultations.filter(
        (item) => item.status === "assigned" || item.status === "in_consultation"
      );
      return {
        totalConsultations: state.consultations.length,
        completedConsultations: completed.length,
        pendingConsultations: state.consultations.filter(
          (item) => item.status === "payment_pending" || item.status === "queued"
        ).length,
        activeConsultations: assigned.length,
        dailyRevenue: paid.reduce((sum, item) => sum + item.amount, 0),
        averageCallbackTimeMinutes: assigned.length || completed.length ? 11 : 0,
        repeatUsers: Math.max(
          0,
          state.users.filter((user) => user.role === "patient").length -
            new Set(state.consultations.map((item) => item.patientUserId)).size
        ),
        completionRate: state.consultations.length
          ? Math.round((completed.length / state.consultations.length) * 100)
          : 0,
        doctorsOnline: state.doctors.filter((item) => item.availabilityStatus === "online").length,
        slaBreaches: state.consultations.filter(
          (c) =>
            (c.status === "assigned" || c.status === "queued") &&
            c.callbackDeadline &&
            new Date(c.callbackDeadline).getTime() < Date.now()
        ).length,
        notificationQueue: state.notifications.length
      };
    },
    adminReports() {
      return {
        consultations: state.consultations,
        payments: state.payments,
        feedbacks: state.feedbacks,
        referrals: state.referrals,
        organizations: state.organizations
      };
    },
    doctorPerformance() {
      return state.doctors.map((doctor) => ({
        doctorId: doctor.id,
        name: doctor.name,
        callsToday: doctor.callsToday,
        rating: doctor.rating,
        earnedToday: doctor.earnedToday,
        availabilityStatus: doctor.availabilityStatus
      }));
    },
    adminRevenue() {
      return {
        dailyRevenue: state.consultations
          .filter((item) => item.paymentStatus === "paid")
          .reduce((sum, item) => sum + item.amount, 0),
        payments: state.payments,
        byPlan: state.consultations.reduce<Record<string, number>>((acc, item) => {
          if (item.paymentStatus === "paid") acc[item.plan] = (acc[item.plan] ?? 0) + item.amount;
          return acc;
        }, {})
      };
    },
    sendNotification(input: {
      channel: NotificationChannel;
      phone: string;
      template: WhatsAppTemplate | string;
      language: "Hindi" | "English";
    }) {
      const template = input.template as WhatsAppTemplate;
      const message =
        template in {
          booking_started: 1,
          payment_successful: 1,
          doctor_assigned: 1,
          doctor_call_15_minutes: 1,
          prescription_ready: 1,
          feedback_request: 1,
          follow_up_reminder: 1
        }
          ? buildWhatsAppMessage(template, input.language)
          : String(input.template);

      const notification: DemoNotification = {
        id: id("notification"),
        ...input,
        message,
        status: "queued",
        createdAt: nowIso()
      };

      // Real WhatsApp Meta Cloud API dispatcher if configured
      if (input.channel === "whatsapp" && process.env.WHATSAPP_PROVIDER === "cloud_api" && process.env.WHATSAPP_ACCESS_TOKEN) {
        try {
          void fetch(
            `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: input.phone.replace(/\D/g, ""),
                type: "text",
                text: { body: message }
              })
            }
          ).then(async (res) => {
            if (res.ok) {
              notification.status = "sent";
              saveState();
            }
          });
        } catch {
          // Fallback to queue
        }
      }

      state.notifications.push(notification);
      saveState();
      return notification;
    },
    listNotifications() {
      return state.notifications;
    },
    listAuditLogs() {
      return state.auditLogs;
    },

    // ---------------------------------------------------------
    // Telephony Bridge Engine (Exotel / Twilio / PSTN Masking)
    // ---------------------------------------------------------
    initiateTelephonyBridge(input: { consultationId: string; doctorPhone: string }) {
      const consultation = state.consultations.find((item) => item.id === input.consultationId);
      if (!consultation) throw new Error("Consultation not found.");
      const patient = state.patients.find((item) => item.id === consultation.patientId);
      const patientUser = state.users.find((item) => item.id === consultation.patientUserId);
      const patientPhone = patientUser?.phone ?? "+919711000001";

      const bridgeId = id("bridge");
      const maskedPatient = patientPhone.replace(/(\+91\d{2})\d{4}(\d{4})/, "$1XXXX$2");

      const bridge: TelephonyBridge = {
        bridgeId,
        consultationId: input.consultationId,
        doctorPhone: input.doctorPhone,
        maskedPatientPhone: maskedPatient,
        provider: process.env.EXOTEL_API_KEY ? "exotel" : "simulated_pstn",
        status: "connected",
        callSid: `call_bridge_${crypto.randomUUID().slice(0, 8)}`,
        durationSeconds: 0,
        createdAt: nowIso()
      };

      state.telephonyBridges.push(bridge);
      consultation.status = "in_consultation";
      if (!consultation.startedAt) consultation.startedAt = nowIso();

      saveState();
      return bridge;
    },

    // ---------------------------------------------------------
    // System Settings & Dynamic Runtime Governance
    // ---------------------------------------------------------
    getSettings(): SystemSettings {
      if (!state.settings) {
        state.settings = getDefaultSettings();
      }
      return state.settings;
    },
    updateSettings(patch: Partial<SystemSettings>, actor?: { id?: string; name?: string }): SystemSettings {
      if (!state.settings) {
        state.settings = getDefaultSettings();
      }
      const updated: SystemSettings = {
        ...state.settings,
        ...patch,
        updatedAt: nowIso(),
        updatedBy: actor?.name ?? actor?.id ?? "Admin"
      };
      state.settings = updated;
      state.auditLogs.push({
        id: id("audit"),
        actorId: actor?.id ?? "admin",
        action: "system_settings_updated",
        entityType: "system_settings",
        metadata: {
          patch,
          updatedBy: updated.updatedBy,
          timestamp: updated.updatedAt
        },
        createdAt: nowIso()
      });
      saveState();
      return state.settings;
    }
  };

  return api;
}
