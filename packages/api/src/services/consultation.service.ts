import {
  callbackDeadline,
  detectEmergency,
  getConsultationPrice,
  selectDoctorForConsultation,
  type DoctorCandidate
} from "@neighbourdoc/shared";
import type { AuthTokenPayload, CreateConsultationInput } from "../types/index.ts";

export function canAccessConsultation(
  actor: AuthTokenPayload,
  consultation: {
    doctorId?: string | null;
    doctorUserId?: string | null;
    patientUserId?: string | null;
    patientId?: string;
    organizationId?: string | null;
  }
): boolean {
  if (actor.role === "admin" || actor.role === "superadmin") return true;
  if (actor.role === "doctor") {
    return Boolean(
      (consultation.doctorId && actor.doctorId && consultation.doctorId === actor.doctorId) ||
      (consultation.doctorUserId && consultation.doctorUserId === actor.sub) ||
      (consultation.doctorId && consultation.doctorId === actor.sub)
    );
  }
  if (actor.role === "patient") {
    return Boolean(consultation.patientUserId && consultation.patientUserId === actor.sub);
  }
  if (actor.role === "partner") {
    return Boolean(
      actor.organizationId &&
      consultation.organizationId &&
      actor.organizationId === consultation.organizationId
    );
  }
  return false;
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
