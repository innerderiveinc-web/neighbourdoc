import { prisma } from "./index";
import type {
  Prisma,
  ConsultationStatus,
  PaymentStatus,
  UrgencyLevel,
  UserRole,
  Language,
  Gender
} from "@prisma/client";

export class DatabaseRepository {
  /**
   * Healthcheck for database connectivity
   */
  static async checkConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Find user by phone number
   */
  static async findUserByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
      include: {
        patientProfile: true,
        doctorProfile: true
      }
    });
  }

  /**
   * Create or update patient user in a transaction
   */
  static async findOrCreatePatient(input: {
    name: string;
    phone: string;
    age: number;
    gender: "male" | "female" | "other";
    city: string;
    locality?: string;
    language?: Language;
  }) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let user = await tx.user.findUnique({
        where: { phone: input.phone },
        include: { patientProfile: true }
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            name: input.name,
            phone: input.phone,
            role: "patient",
            language: input.language ?? "Hindi",
            patientProfile: {
              create: {
                age: input.age,
                gender: input.gender,
                city: input.city,
                locality: input.locality
              }
            }
          },
          include: { patientProfile: true }
        });
      } else if (!user.patientProfile) {
        const patientProfile = await tx.patientProfile.create({
          data: {
            userId: user.id,
            age: input.age,
            gender: input.gender,
            city: input.city,
            locality: input.locality
          }
        });
        user = { ...user, patientProfile };
      }

      return user;
    });
  }

  /**
   * Create a new consultation record
   */
  static async createConsultation(input: {
    publicId: string;
    patientId: string;
    doctorId?: string | null;
    organizationId?: string | null;
    symptoms: string;
    existingIllnesses?: string;
    urgencyLevel: UrgencyLevel;
    status: ConsultationStatus;
    paymentStatus: PaymentStatus;
    callbackDeadline?: Date | null;
    consentAt: Date;
  }) {
    return prisma.consultation.create({
      data: {
        publicId: input.publicId,
        patientId: input.patientId,
        doctorId: input.doctorId ?? undefined,
        organizationId: input.organizationId ?? undefined,
        symptoms: input.symptoms,
        existingIllnesses: input.existingIllnesses ?? "",
        urgencyLevel: input.urgencyLevel,
        status: input.status,
        paymentStatus: input.paymentStatus,
        callbackDeadline: input.callbackDeadline ?? undefined,
        consentAt: input.consentAt
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } }
      }
    });
  }

  /**
   * Find consultation by ID with relationships
   */
  static async findConsultationById(id: string) {
    return prisma.consultation.findFirst({
      where: {
        OR: [{ id }, { publicId: id }]
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        prescriptions: true,
        payments: true
      }
    });
  }

  /**
   * Atomic payment verification & doctor assignment transaction
   */
  static async recordPaymentAndAssign(input: {
    consultationId: string;
    patientId: string;
    amount: number;
    gatewayOrderId: string;
    gatewayPaymentId: string;
    gatewaySignature?: string;
    assignedDoctorId?: string | null;
    callbackDeadline?: Date | null;
  }) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Record payment
      const payment = await tx.payment.create({
        data: {
          consultationId: input.consultationId,
          patientId: input.patientId,
          amount: input.amount,
          gateway: "razorpay",
          gatewayOrderId: input.gatewayOrderId,
          gatewayPaymentId: input.gatewayPaymentId,
          gatewaySignature: input.gatewaySignature,
          status: "paid"
        }
      });

      // 2. Update consultation status atomically
      const consultation = await tx.consultation.update({
        where: { id: input.consultationId },
        data: {
          status: input.assignedDoctorId ? "assigned" : "queued",
          paymentStatus: "paid",
          doctorId: input.assignedDoctorId ?? undefined,
          callbackDeadline: input.callbackDeadline ?? undefined
        },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } }
        }
      });

      // 3. Update doctor assignment timestamp
      if (input.assignedDoctorId) {
        await tx.doctorProfile.update({
          where: { id: input.assignedDoctorId },
          data: { lastAssignedAt: new Date() }
        });
      }

      return { payment, consultation };
    });
  }

  /**
   * Atomic consultation completion & prescription creation
   */
  static async completeConsultation(input: {
    consultationId: string;
    doctorId: string;
    medicines: Record<string, unknown> | Array<unknown>;
    advice: string;
    followUpDate?: Date | null;
    fileUrl?: string | null;
    payoutAmount: number;
  }) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check existing to enforce idempotency
      const existingPrescription = await tx.prescription.findFirst({
        where: { consultationId: input.consultationId }
      });

      if (existingPrescription) {
        const consultation = await tx.consultation.findUnique({
          where: { id: input.consultationId }
        });
        const earning = await tx.doctorEarning.findFirst({
          where: { consultationId: input.consultationId }
        });
        return { consultation, prescription: existingPrescription, earning, alreadyCompleted: true };
      }

      // 1. Create prescription
      const prescription = await tx.prescription.create({
        data: {
          consultationId: input.consultationId,
          doctorId: input.doctorId,
          medicines: input.medicines as any,
          advice: input.advice,
          followUpDate: input.followUpDate ?? undefined,
          fileUrl: input.fileUrl ?? undefined
        }
      });

      // 2. Update consultation status
      const consultation = await tx.consultation.update({
        where: { id: input.consultationId },
        data: {
          status: "completed",
          completedAt: new Date()
        }
      });

      // 3. Record doctor earning
      const earning = await tx.doctorEarning.create({
        data: {
          doctorId: input.doctorId,
          consultationId: input.consultationId,
          amount: input.payoutAmount,
          payoutStatus: "pending"
        }
      });

      return { consultation, prescription, earning };
    });
  }

  /**
   * Log an audit action
   */
  static async logAudit(input: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }) {
    return prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? undefined,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: (input.metadata as any) ?? undefined
      }
    });
  }

  /**
   * DPDP 2023 Compliant Patient Data Erasure / Anonymization
   */
  static async anonymizePatientData(userId: string, actorId: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: "Anonymized Patient",
          phone: `+91000000${userId.slice(-4)}`
        }
      });
      await tx.patientProfile.updateMany({
        where: { userId },
        data: {
          city: "Redacted",
          locality: "Redacted"
        }
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: "patient_data_erasure_executed",
          entityType: "patient",
          entityId: userId
        }
      });
    });
  }
}
