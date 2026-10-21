import { z } from "zod";

export type UserRole = "patient" | "doctor" | "admin" | "superadmin" | "partner";
export type Language = "Hindi" | "English" | "Hinglish" | "Marathi" | "Bengali" | "Tamil";
export type ConsultationPlan = "basic" | "priority" | "family_monthly" | "organization_custom";
export type UrgencyLevel = "normal" | "urgent" | "emergency";
export type ConsultationStatus =
  | "draft"
  | "payment_pending"
  | "paid"
  | "queued"
  | "assigned"
  | "in_consultation"
  | "completed"
  | "cancelled"
  | "refunded"
  | "escalated";

export type DoctorCandidate = {
  id: string;
  city: string;
  languages: Language[];
  verified: boolean;
  available: boolean;
  lastAssignedAt: string | null;
};

export type AssignmentRequest = {
  city: string;
  language: Language;
};

export type AccessActor = {
  userId?: string;
  role: UserRole;
  organizationId?: string;
};

export type ConsultationAccessRecord = {
  patientUserId: string;
  doctorUserId: string | null;
  organizationId?: string | null;
};

export type SystemSettings = {
  basicConsultationFee: number;
  priorityConsultationFee: number;
  doctorPayoutShare: number;
  slaCallbackMinutes: number;
  emergencyHelpline: string;
  supportPhone: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  activeOtpProvider: "mock" | "msg91" | "twilio";
  activePaymentGateway: "mock" | "razorpay";
  updatedAt: string;
  updatedBy: string;
};

const emergencyTerms = [
  // Cardiovascular & Chest Symptoms
  "chest pain",
  "heart attack",
  "cardiac arrest",
  "chest pressure",
  "छाती में दर्द",
  "dil ka daura",

  // Respiratory Emergencies
  "breathing difficulty",
  "shortness of breath",
  "saans lene me taklif",
  "saans phoolna",
  "दम घुटना",
  "choking",
  "cyanosis",
  "saans",

  // Neurological & Altered Sensorium
  "unconscious",
  "fainted",
  "loss of consciousness",
  "बेहोश",
  "बेहोशी",
  "seizure",
  "mirgi",
  "daura",
  "convulsions",
  "fits",
  "stroke",
  "paralysis",
  "lakwa",
  "falij",
  "slurred speech",

  // Severe Trauma & Bleeding
  "severe bleeding",
  "heavy bleeding",
  "khoon behna",
  "major accident",
  "road accident",
  "head injury",
  "sar me chot",
  "severe burn",
  "jal gaya",
  "fracture",

  // Poisoning, Toxins & Bites
  "poisoning",
  "poison",
  "zeher",
  "zahar",
  "snake bite",
  "saanp ne kaat liya",
  "drug overdose",

  // High-Risk Obstetric & Neonatal
  "pregnancy emergency",
  "labor pain",
  "garbhavastha emergency",
  "newborn not breathing",

  // Psychiatric Crises
  "suicide",
  "suicidal",
  "kill myself",
  "atmahathya",

  // Anaphylaxis
  "anaphylaxis",
  "throat closing",
  "gala band",
  "severe allergic reaction",

  // Shorter clinical anchors
  "छाती"
];

const planPrices: Record<ConsultationPlan, { amount: number; label: string; currency: "INR" }> = {
  basic: { amount: 4900, label: "Basic", currency: "INR" },
  priority: { amount: 9900, label: "Priority", currency: "INR" },
  family_monthly: { amount: 19900, label: "Family Monthly", currency: "INR" },
  organization_custom: { amount: 0, label: "Organization Custom", currency: "INR" }
};

export function detectEmergency(symptoms: string): {
  blocked: boolean;
  urgencyLevel: UrgencyLevel;
  matchedTerms: string[];
  message: string;
} {
  const normalized = symptoms.toLowerCase();
  const matchedTerms = emergencyTerms.filter((term) => normalized.includes(term.toLowerCase()));

  if (matchedTerms.length > 0) {
    return {
      blocked: true,
      urgencyLevel: "emergency",
      matchedTerms,
      message: "This may be a medical emergency. Please call 112 or go to the nearest hospital immediately."
    };
  }

  return {
    blocked: false,
    urgencyLevel: normalized.includes("high fever") || normalized.includes("severe pain") ? "urgent" : "normal",
    matchedTerms: [],
    message: "Online consultation can continue."
  };
}

export function getConsultationPrice(plan: ConsultationPlan) {
  return planPrices[plan];
}

export function selectDoctorForConsultation(doctors: DoctorCandidate[], request: AssignmentRequest) {
  const scored = doctors
    .filter((doctor) => doctor.verified && doctor.available)
    .map((doctor) => ({
      doctor,
      cityScore: doctor.city.toLowerCase() === request.city.toLowerCase() ? 0 : 1,
      languageScore: doctor.languages.includes(request.language) ? 0 : doctor.languages.includes("Hindi") ? 1 : 2,
      assignedAt: doctor.lastAssignedAt ? new Date(doctor.lastAssignedAt).getTime() : 0
    }))
    .sort((a, b) => a.cityScore - b.cityScore || a.languageScore - b.languageScore || a.assignedAt - b.assignedAt);

  return scored[0]?.doctor ?? null;
}

export function canAccessConsultation(actor: AccessActor, consultation: ConsultationAccessRecord) {
  if (actor.role === "admin" || actor.role === "superadmin") return true;
  if (actor.role === "patient") return actor.userId === consultation.patientUserId;
  if (actor.role === "doctor") return actor.userId === consultation.doctorUserId;
  if (actor.role === "partner") return Boolean(actor.organizationId && actor.organizationId === consultation.organizationId);
  return false;
}

export function callbackDeadline(createdAt: Date, minutes = 15) {
  return new Date(createdAt.getTime() + minutes * 60_000);
}

export function isSlaBreached(deadline: Date, now = new Date()) {
  return now.getTime() > deadline.getTime();
}

// ---------------------------------------------------------
// Zod Schemas for Runtime Validation
// ---------------------------------------------------------

export const PhoneSchema = z
  .string()
  .trim()
  .transform((val) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      return `+91${digits}`;
    }
    if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
      return `+${digits}`;
    }
    return val;
  })
  .refine((val) => /^\+91[6-9]\d{9}$/.test(val), {
    message: "Enter a valid 10-digit Indian mobile number in +91XXXXXXXXXX format."
  });

export const SendOtpSchema = z.object({
  phone: PhoneSchema,
  role: z.enum(["patient", "doctor", "admin", "superadmin", "partner"]).optional()
});

export const VerifyOtpSchema = z.object({
  phone: PhoneSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be a 6-digit numeric code."),
  role: z.enum(["patient", "doctor", "admin", "superadmin", "partner"]).optional(),
  name: z.string().optional()
});

export const BookingSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  phone: PhoneSchema,
  age: z.coerce.number().int().min(1, "Age must be at least 1 year.").max(120, "Age cannot exceed 120."),
  gender: z.enum(["male", "female", "other"]).default("male"),
  city: z.string().trim().min(2, "City name must be at least 2 characters.").max(50),
  locality: z.string().trim().max(100).optional().default(""),
  language: z.enum(["Hindi", "English", "Hinglish", "Marathi", "Bengali", "Tamil"]).default("Hindi"),
  symptoms: z.string().trim().min(5, "Please describe symptoms in at least 5 characters.").max(2000),
  existingIllnesses: z.string().trim().max(500).optional().default(""),
  plan: z.enum(["basic", "priority", "family_monthly", "organization_custom"]).default("basic"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Affirmative patient consent is required before booking." })
  }),
  referralSource: z.string().optional(),
  organizationId: z.string().optional()
});

export const CreateDoctorSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  phone: PhoneSchema,
  city: z.string().trim().min(2, "City must be at least 2 characters.").max(50),
  languages: z
    .array(z.enum(["Hindi", "English", "Hinglish", "Marathi", "Bengali", "Tamil"]))
    .min(1, "Select at least one consultation language."),
  specialization: z.string().trim().min(2, "Specialization must be at least 2 characters.").max(100),
  registrationNumber: z.string().trim().min(3, "Registration number must be at least 3 characters.").max(50),
  consultationFee: z.coerce.number().int().min(0).max(5000).default(49),
  qualification: z.string().trim().max(100).optional().default("MBBS")
});

export const DoctorAvailabilitySchema = z.object({
  availabilityStatus: z.enum(["online", "offline", "busy"])
});

export const CompleteConsultationSchema = z.object({
  medicines: z.string().trim().min(3, "Medicines description must be at least 3 characters."),
  advice: z.string().trim().min(3, "Clinical advice must be at least 3 characters."),
  followUpDate: z.string().optional(),
  fileUrl: z.string().url().optional()
});

export const CreatePaymentOrderSchema = z.object({
  plan: z.enum(["basic", "priority", "family_monthly", "organization_custom"]).default("basic"),
  consultationId: z.string().optional(),
  patientId: z.string().optional()
});

export const VerifyPaymentSchema = z.object({
  consultationId: z.string().min(1, "consultationId is required"),
  orderId: z.string().min(1, "orderId is required"),
  gatewayPaymentId: z.string().min(1, "gatewayPaymentId is required"),
  signature: z.string().optional()
});

export const RefundSchema = z.object({
  reason: z.string().trim().min(3, "Refund reason must be at least 3 characters.").max(500).optional()
});

export const ContactTicketSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  phone: PhoneSchema,
  message: z.string().trim().min(5, "Message must be at least 5 characters.").max(2000)
});

export const AddOrganizationMemberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  phone: PhoneSchema,
  employeeCode: z.string().trim().min(1, "Employee code is required.").max(50),
  age: z.coerce.number().int().min(1).max(120).optional(),
  gender: z.enum(["male", "female", "other"]).optional()
});
