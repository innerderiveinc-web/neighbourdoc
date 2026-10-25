import type { SystemSettings } from "@neighbourdoc/shared";
import type { DemoDoctor, DemoUser } from "../types/index.ts";

export function getDefaultSettings(): SystemSettings {
  const nowIso = new Date().toISOString();
  return {
    basicConsultationFee: 49,
    priorityConsultationFee: 99,
    doctorPayoutShare: 30,
    slaCallbackMinutes: 15,
    emergencyHelpline: "112 / 108",
    supportPhone: "+918000000000",
    maintenanceMode: false,
    maintenanceMessage: "सिस्टम नियमित रखरखाव (maintenance) के अंतर्गत है। आपातकाल में 112 डायल करें।",
    activeOtpProvider: (process.env.OTP_PROVIDER as "mock" | "msg91" | "twilio") ?? "mock",
    activePaymentGateway: (process.env.RAZORPAY_KEY_ID ? "razorpay" : "mock") as "mock" | "razorpay",
    updatedAt: nowIso,
    updatedBy: "System Default"
  };
}

export function getInitialDoctors(): DemoDoctor[] {
  const nowIso = new Date().toISOString();
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
      createdAt: nowIso
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
      createdAt: nowIso
    }
  ];
}

export function getInitialUsers(): DemoUser[] {
  const nowIso = new Date().toISOString();
  return [
    {
      id: "user_admin_1",
      name: "NeighbourDoc Operations Admin",
      phone: "+919999999999",
      role: "admin",
      language: "English",
      createdAt: nowIso
    },
    {
      id: "user_doctor_1",
      name: "डॉ. प्रिया शर्मा",
      phone: "+919800000001",
      role: "doctor",
      language: "Hindi",
      createdAt: nowIso
    },
    {
      id: "user_doctor_2",
      name: "डॉ. राहुल वर्मा",
      phone: "+919800000002",
      role: "doctor",
      language: "Hindi",
      createdAt: nowIso
    }
  ];
}
