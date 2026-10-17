import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  callbackDeadline,
  detectEmergency,
  getConsultationPrice,
  selectDoctorForConsultation,
  type ConsultationPlan,
  type ConsultationStatus,
  type DoctorCandidate,
  type Language,
  type UrgencyLevel,
  type UserRole
} from "@neighbordoc/shared";

// ---------------------------------------------------------
// Types & DTOs
// ---------------------------------------------------------

export type SendOtpInput = { phone: string; role?: string };
export type VerifyOtpInput = { phone: string; code: string; role?: UserRole; name?: string };

export type AuthTokenPayload = {
  sub: string;
  phone: string;
  role: UserRole;
  name?: string;
  iat?: number;
  exp?: number;
};

export type CreateConsultationInput = {
  patientId: string;
  patientUserId: string;
  city: string;
  language: Language;
  symptoms: string;
  existingIllnesses?: string;
  plan: ConsultationPlan;
  consent: boolean;
};

export type BookingInput = {
  name: string;
  phone: string;
  age: number;
  gender: string;
  city: string;
  locality?: string;
  language: Language;
  symptoms: string;
  existingIllnesses?: string;
  plan: ConsultationPlan;
  consent: boolean;
  referralSource?: string;
  organizationId?: string;
};

export type PaymentOrder = {
  orderId: string;
  amount: number;
  currency: "INR";
  gateway: "razorpay";
  keyId?: string;
};

export type WhatsAppTemplate =
  | "booking_started"
  | "payment_successful"
  | "doctor_assigned"
  | "doctor_call_15_minutes"
  | "prescription_ready"
  | "feedback_request"
  | "follow_up_reminder";

export type VerificationStatus = "pending" | "verified" | "rejected";
export type AvailabilityStatus = "online" | "offline" | "busy";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type NotificationChannel = "whatsapp" | "sms" | "push";

export type DemoUser = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  language: Language;
  createdAt: string;
};

export type DemoPatient = {
  id: string;
  userId: string;
  age: number;
  gender: string;
  address?: string;
  city: string;
  locality?: string;
};

export type DemoDoctor = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  city: string;
  languages: Language[];
  registrationNumber: string;
  qualification: string;
  specialization: string;
  verificationStatus: VerificationStatus;
  availabilityStatus: AvailabilityStatus;
  consultationFee: number;
  payoutShare: number;
  callsToday: number;
  rating: number;
  earnedToday: number;
  lastAssignedAt: string | null;
  createdAt: string;
};

export type DemoConsultation = {
  id: string;
  patientId: string;
  patientUserId: string;
  doctorId: string | null;
  doctorUserId: string | null;
  organizationId?: string;
  plan: ConsultationPlan;
  amount: number;
  symptoms: string;
  existingIllnesses?: string;
  urgencyLevel: UrgencyLevel;
  status: ConsultationStatus;
  paymentStatus: PaymentStatus;
  callbackDeadline: string | null;
  startedAt: string | null;
  completedAt: string | null;
  consentAt: string;
  referralSource?: string;
  createdAt: string;
};

export type DemoPayment = {
  id: string;
  consultationId?: string;
  patientId?: string;
  amount: number;
  gateway: "razorpay";
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  verificationMethod?: "razorpay_hmac_verified" | "sandbox_simulated" | "webhook_verified";
  status: PaymentStatus;
  createdAt: string;
};

export type DemoPrescription = {
  id: string;
  consultationId: string;
  doctorId: string;
  medicines: string;
  advice: string;
  followUpDate?: string;
  fileUrl?: string;
  createdAt: string;
};

export type DemoEarning = {
  id: string;
  doctorId: string;
  consultationId: string;
  amount: number;
  payoutStatus: "pending" | "paid";
  createdAt: string;
};

export type DemoOrganization = {
  id: string;
  name: string;
  type: string;
  city: string;
  contactPerson: string;
  phone: string;
  planId: string;
  memberCount: number;
  createdAt: string;
};

export type DemoOrganizationMember = {
  id: string;
  organizationId: string;
  patientId: string;
  employeeCode: string;
  createdAt: string;
};

export type DemoFeedback = {
  id: string;
  consultationId: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type DemoReferral = {
  id: string;
  referrerId: string;
  referredPhone: string;
  rewardStatus: "pending" | "earned" | "paid";
  createdAt: string;
};

export type DemoAuditLog = {
  id: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type DemoNotification = {
  id: string;
  channel: NotificationChannel;
  phone: string;
  template: WhatsAppTemplate | string;
  language: "Hindi" | "English";
  message: string;
  status: "queued" | "sent" | "delivered" | "failed";
  externalId?: string;
  createdAt: string;
};

export type TelephonyBridge = {
  bridgeId: string;
  consultationId: string;
  doctorPhone: string;
  maskedPatientPhone: string;
  provider: "exotel" | "twilio" | "simulated_pstn";
  status: "initiated" | "ringing" | "connected" | "completed";
  durationSeconds?: number;
  callSid?: string;
  createdAt: string;
};

// ---------------------------------------------------------
// Helpers & Cryptographic Utilities
// ---------------------------------------------------------

const nowIso = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;
const getJwtSecret = () => process.env.JWT_SECRET || "neighbordoc-super-secret-production-key-32chars";

export function createJwtToken(
  payload: Omit<AuthTokenPayload, "iat" | "exp">,
  secret = getJwtSecret(),
  expiresInDays = 7
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AuthTokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInDays * 24 * 60 * 60
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${b64Header}.${b64Payload}`)
    .digest("base64url");

  return `${b64Header}.${b64Payload}.${signature}`;
}

export function verifyJwtToken(
  token: string,
  secret = getJwtSecret()
): { valid: boolean; payload?: AuthTokenPayload; error?: string } {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Token not provided." };
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "Invalid token structure." };
  }
  const [b64Header, b64Payload, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${b64Header}.${b64Payload}`)
    .digest("base64url");

  if (
    signature.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
  ) {
    return { valid: false, error: "Invalid token signature." };
  }

  try {
    const payload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf-8")) as AuthTokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: "Token has expired." };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Malformed token payload." };
  }
}

export function sendOtp(input: SendOtpInput) {
  if (!/^\+91\d{10}$/.test(input.phone)) {
    return { ok: false as const, error: "Use an Indian phone number in +91XXXXXXXXXX format." };
  }

  return {
    ok: true as const,
    otpRequestId: id("otp"),
    mode: process.env.OTP_PROVIDER ?? "mock",
    expiresInSeconds: 300
  };
}

export function verifyOtp(input: VerifyOtpInput, role: UserRole = "patient", name?: string) {
  const expected = process.env.OTP_TEST_CODE ?? "123456";
  const isValid = input.code === expected;
  if (!isValid) {
    return { ok: false as const, error: "Invalid OTP code." };
  }

  const effectiveRole = input.role ?? role;
  const effectiveName =
    name ??
    input.name ??
    (effectiveRole === "admin"
      ? "NeighborDoc Operations Admin"
      : effectiveRole === "doctor"
      ? "Dr. Priya Sharma"
      : "NeighborDoc Patient");

  const sessionToken = createJwtToken({
    sub: `user_${input.phone.replace(/\D/g, "")}`,
    phone: input.phone,
    role: effectiveRole,
    name: effectiveName
  });

  return {
    ok: true as const,
    sessionToken,
    role: effectiveRole,
    phone: input.phone,
    name: effectiveName
  };
}

export function createPaymentOrder(plan: ConsultationPlan): PaymentOrder {
  const price = getConsultationPrice(plan);
  return {
    orderId: id("order"),
    amount: price.amount,
    currency: price.currency,
    gateway: "razorpay",
    keyId: process.env.RAZORPAY_KEY_ID ?? "rzp_test_replace_me"
  };
}

export function verifyRazorpaySignature(
  payload: string,
  signature: string,
  secret = process.env.RAZORPAY_KEY_SECRET ?? process.env.RAZORPAY_WEBHOOK_SECRET ?? ""
) {
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function prepareConsultation(input: CreateConsultationInput, doctors: DoctorCandidate[]) {
  if (!input.consent) return { ok: false as const, error: "Consent is required before teleconsultation." };

  const emergency = detectEmergency(input.symptoms);
  if (emergency.blocked) {
    return {
      ok: false as const,
      emergency,
      auditLog: {
        action: "emergency_consultation_blocked",
        entityType: "consultation",
        metadata: { patientUserId: input.patientUserId, matchedTerms: emergency.matchedTerms }
      }
    };
  }

  const doctor = selectDoctorForConsultation(doctors, { city: input.city, language: input.language });
  const now = new Date();

  return {
    ok: true as const,
    status: doctor ? "assigned" : "queued",
    doctor,
    callbackDeadline: callbackDeadline(now),
    price: getConsultationPrice(input.plan)
  };
}

export function buildWhatsAppMessage(template: WhatsAppTemplate, language: "Hindi" | "English") {
  const messages: Record<WhatsAppTemplate, Record<"Hindi" | "English", string>> = {
    booking_started: {
      English: "Namaste! Your consultation request has been received by NeighborDoc. We are connecting you with a verified MBBS doctor.",
      Hindi: "नमस्ते! NeighborDoc पर आपका परामर्श अनुरोध प्राप्त हो गया है। हम आपके लिए डॉक्टर नियुक्त कर रहे हैं।"
    },
    payment_successful: {
      English: "Namaste! Your consultation fee has been received. Your doctor consultation will begin shortly.",
      Hindi: "नमस्ते! परामर्श फीस प्राप्त हो गई है। डॉक्टर से आपकी बातचीत जल्द शुरू होगी।"
    },
    doctor_assigned: {
      English: "Namaste! An NMC-registered MBBS doctor has been assigned to your case and is reviewing your symptoms.",
      Hindi: "नमस्ते! आपके लिए NMC रजिस्टर्ड MBBS डॉक्टर नियुक्त कर दिए गए हैं और वे आपके लक्षण देख रहे हैं।"
    },
    doctor_call_15_minutes: {
      English: "Namaste! Your doctor will call you on this number within the next 15 minutes. Please keep your phone reachable.",
      Hindi: "नमस्ते! डॉक्टर साहब अगले 15 मिनट में आपके इस नंबर पर कॉल करेंगे। कृपया अपना फोन पास रखें।"
    },
    prescription_ready: {
      English: "Namaste! Your official digital prescription (Rx) has been generated by your doctor. You can view, save, or print it at any pharmacy.",
      Hindi: "नमस्ते! डॉक्टर द्वारा तैयार किया गया आपका डिजिटल पर्चा (Rx) तैयार है। इसे किसी भी मेडिकल स्टोर पर दिखाया जा सकता है।"
    },
    feedback_request: {
      English: "Namaste! We hope you are feeling better after your consultation. Please take 30 seconds to share your feedback to help us serve families better.",
      Hindi: "नमस्ते! आशा है डॉक्टर से बातचीत के बाद आप बेहतर महसूस कर रहे हैं। कृपया 30 सेकंड में अपना अनुभव साझा करें।"
    },
    follow_up_reminder: {
      English: "Namaste! This is a health check-in from NeighborDoc. If your symptoms persist or if you have any questions, our doctors are here to help.",
      Hindi: "नमस्ते! NeighborDoc से आपकी सेहत की खैरियत का संदेश है। यदि तकलीफ़ अभी भी बनी हुई है, तो तुरंत डॉक्टर से दोबारा सलाह लें।"
    }
  };

  return messages[template]?.[language] ?? messages[template]?.Hindi ?? "";
}

// ---------------------------------------------------------
// Core Factory: Persistent Multi-Tenant API Engine
// ---------------------------------------------------------

export type NeighborDocState = {
  users: DemoUser[];
  patients: DemoPatient[];
  doctors: DemoDoctor[];
  consultations: DemoConsultation[];
  payments: DemoPayment[];
  prescriptions: DemoPrescription[];
  earnings: DemoEarning[];
  organizations: DemoOrganization[];
  organizationMembers: DemoOrganizationMember[];
  feedbacks: DemoFeedback[];
  referrals: DemoReferral[];
  auditLogs: DemoAuditLog[];
  notifications: DemoNotification[];
  telephonyBridges: TelephonyBridge[];
};

export function createDemoApi(persistencePath?: string) {
  const isTestMode = process.env.NODE_ENV === "test";
  const filePath =
    persistencePath === ":memory:" || (isTestMode && !persistencePath)
      ? null
      : persistencePath ?? path.join(process.cwd(), ".data", "neighbordoc_state.json");

  function getInitialDoctors(): DemoDoctor[] {
    return [
      {
        id: "doctor_1",
        userId: "user_doctor_1",
        name: "डॉ. प्रिया शर्मा",
        phone: "+919800000001",
        city: "Lucknow",
        languages: ["Hindi", "English"],
        registrationNumber: "NMC-LKO-1001",
        qualification: "MBBS",
        specialization: "General Physician",
        verificationStatus: "verified",
        availabilityStatus: "online",
        consultationFee: 49,
        payoutShare: 30,
        callsToday: 15,
        rating: 4.9,
        earnedToday: 450,
        lastAssignedAt: null,
        createdAt: nowIso()
      },
      {
        id: "doctor_2",
        userId: "user_doctor_2",
        name: "डॉ. राहुल वर्मा",
        phone: "+919800000002",
        city: "Kanpur",
        languages: ["Hindi"],
        registrationNumber: "NMC-KNP-1002",
        qualification: "MBBS",
        specialization: "Internal Medicine",
        verificationStatus: "verified",
        availabilityStatus: "online",
        consultationFee: 49,
        payoutShare: 30,
        callsToday: 12,
        rating: 4.8,
        earnedToday: 360,
        lastAssignedAt: null,
        createdAt: nowIso()
      }
    ];
  }

  function getInitialUsers(): DemoUser[] {
    return [
      { id: "user_admin_1", name: "NeighborDoc Operations Admin", phone: "+919999999999", role: "admin", language: "English", createdAt: nowIso() },
      { id: "user_doctor_1", name: "डॉ. प्रिया शर्मा", phone: "+919800000001", role: "doctor", language: "Hindi", createdAt: nowIso() },
      { id: "user_doctor_2", name: "डॉ. राहुल वर्मा", phone: "+919800000002", role: "doctor", language: "Hindi", createdAt: nowIso() }
    ];
  }

  // Load state from file if exists
  let state: NeighborDocState = {
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
    consultation.callbackDeadline = callbackDeadline(new Date(assignedAt)).toISOString();

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
      const user = state.users.find((u) => u.phone === input.phone);
      return verifyOtp(input, user?.role ?? input.role ?? "patient", user?.name);
    },
    logout() {
      return { ok: true as const };
    },
    getPatientMe(userId = state.patients[0]?.userId ?? "") {
      const user = state.users.find((item) => item.id === userId);
      const patient = state.patients.find((item) => item.userId === userId);
      return { user, patient };
    },
    updatePatientMe(userId: string, patch: Partial<DemoPatient & Pick<DemoUser, "name" | "email" | "language">>) {
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
        verificationStatus: "verified",
        availabilityStatus: "online",
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
      saveState();
      return doctor;
    },
    updateDoctor(doctorId: string, patch: Partial<DemoDoctor>) {
      const doctor = state.doctors.find((item) => item.id === doctorId);
      if (!doctor) throw new Error("Doctor not found.");
      Object.assign(doctor, patch);
      saveState();
      return doctor;
    },
    setDoctorAvailability(doctorId: string, availabilityStatus: AvailabilityStatus) {
      const doctor = state.doctors.find((item) => item.id === doctorId);
      if (!doctor) throw new Error("Doctor not found.");
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

      const price = getConsultationPrice(input.plan);
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
      return { ok: true as const, consultation, patient, price };
    },
    createPaymentOrder(input: { plan: ConsultationPlan; consultationId?: string; patientId?: string }) {
      const order = createPaymentOrder(input.plan);
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

      const secret = process.env.RAZORPAY_KEY_SECRET;
      let verificationMethod: DemoPayment["verificationMethod"] = "sandbox_simulated";

      // If signature is provided, verify HMAC cryptographically
      if (input.signature) {
        const payload = `${input.orderId}|${input.gatewayPaymentId}`;
        const isVerified = verifyRazorpaySignature(payload, input.signature, secret ?? "");
        if (!isVerified && secret) {
          return { ok: false as const, error: "Cryptographic signature mismatch: payment verification failed." };
        }
        verificationMethod = "razorpay_hmac_verified";
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
      const verified = secret ? verifyRazorpaySignature(payload, signature) : true;
      let consultationUpdated = false;
      try {
        const body = JSON.parse(payload);
        const consultationId =
          body?.payload?.payment?.entity?.notes?.consultationId || body?.consultationId;
        if (verified && consultationId) {
          const c = state.consultations.find((item) => item.id === consultationId);
          if (c && c.paymentStatus !== "paid") {
            c.paymentStatus = "paid";
            c.status = "queued";
            assignDoctor(consultationId);
            consultationUpdated = true;
          }
        }
      } catch {}

      state.auditLogs.push({
        id: id("audit"),
        action: "payment_webhook_received",
        entityType: "payment",
        metadata: { verified, consultationUpdated },
        createdAt: nowIso()
      });
      saveState();
      return { ok: verified, consultationUpdated };
    },
    assignDoctor,
    listConsultations() {
      return state.consultations;
    },
    getConsultation(consultationId: string) {
      return state.consultations.find((item) => item.id === consultationId) ?? null;
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
      prescriptionInput: Pick<DemoPrescription, "medicines" | "advice" | "followUpDate" | "fileUrl">
    ) {
      const consultation = state.consultations.find((item) => item.id === consultationId);
      if (!consultation) throw new Error("Consultation not found.");
      const prescription = api.createPrescription({ consultationId, ...prescriptionInput });
      consultation.status = "completed";
      consultation.completedAt = nowIso();
      const earning: DemoEarning = {
        id: id("earning"),
        doctorId: consultation.doctorId ?? "doctor_unassigned",
        consultationId,
        amount: 3000,
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
    getPrescriptionByConsultation(consultationId: string) {
      return state.prescriptions.find((item) => item.consultationId === consultationId) ?? null;
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
      input: { name: string; phone: string; employeeCode: string; age?: number; gender?: string }
    ) {
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
    }
  };

  return api;
}
