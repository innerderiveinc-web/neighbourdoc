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

const emergencyTerms = [
  "chest pain",
  "breathing difficulty",
  "unconscious",
  "severe bleeding",
  "stroke",
  "heart attack",
  "pregnancy emergency",
  "seizure",
  "poisoning",
  "major accident",
  "saans",
  "बेहोश",
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
