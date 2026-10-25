import type {
  ConsultationPlan,
  ConsultationStatus,
  Language,
  SystemSettings,
  UrgencyLevel,
  UserRole
} from "@neighbourdoc/shared";

export type SendOtpInput = { phone: string; role?: string };
export type VerifyOtpInput = { phone: string; code: string; role?: UserRole; name?: string };

export type AuthTokenPayload = {
  sub: string;
  phone: string;
  role: UserRole;
  name?: string;
  doctorId?: string;
  organizationId?: string;
  iss?: string;
  aud?: string;
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
  | "follow_up_reminder"
  | "sla_breach_apology"
  | "doctor_escalation_alert"
  | "follow_up_escalation_alert";

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
  paidAt?: string;
  startedAt: string | null;
  completedAt: string | null;
  cancellationReason?: string;
  followUpSentAt?: string;
  followUpStatus?: "pending" | "sent" | "recovered" | "mild_symptoms" | "worsened_escalated";
  followUpResponseAt?: string;
  followUpResponseNotes?: string;
  consentAt: string;
  referralSource?: string;
  createdAt: string;
};

export type Day3FollowUpReport = {
  timestamp: string;
  eligibleCompletedConsultations: number;
  remindersSentCount: number;
  consultationIds: string[];
};

export type SlaWatchdogAction = {
  consultationId: string;
  action: "escalated_reassigned" | "auto_refunded" | "healthy";
  elapsedMinutes: number;
  details: string;
};

export type SlaWatchdogReport = {
  timestamp: string;
  totalActiveConsultations: number;
  healthyCount: number;
  escalatedCount: number;
  autoRefundedCount: number;
  actions: SlaWatchdogAction[];
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
  payoutStatus: "pending" | "approved" | "paid" | "held";
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

export type DemoContactTicket = {
  id: string;
  name: string;
  phone: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
};

export type NeighbourDocState = {
  settings?: SystemSettings;
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
  contactTickets?: DemoContactTicket[];
  processedWebhookEventIds?: string[];
};

export type NeighborDocState = NeighbourDocState;
