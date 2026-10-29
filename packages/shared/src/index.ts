import { z } from "zod";

export const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.string().optional().default("3000"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required").default("neighbourdoc-super-secret-production-key-32chars"),
    DATABASE_URL: z.string().optional(),
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      if (data.JWT_SECRET.length < 32 || data.JWT_SECRET.includes("super-secret")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_SECRET"],
          message: "In production, JWT_SECRET must be at least 32 characters long and cannot use default placeholders."
        });
      }
    }
  });

export type ValidatedEnv = z.infer<typeof EnvSchema>;

export function getValidatedEnv(customEnv?: Record<string, string | undefined>): ValidatedEnv {
  const envSource = customEnv ?? process.env;
  const result = EnvSchema.safeParse(envSource);

  if (!result.success) {
    const errorDetails = result.error.errors.map((e) => `• [${e.path.join(".")}]: ${e.message}`).join("\n");
    throw new Error(`[CRITICAL] Environment Configuration Failure:\n${errorDetails}`);
  }

  return result.data;
}

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

// ---------------------------------------------------------
// Jan Aushadhi Generic Medicine & Drug Compliance Engine
// ---------------------------------------------------------

export type TelemedicineDrugSchedule = "ListA" | "ListB" | "Prohibited";

export type JanAushadhiMedicine = {
  id: string;
  genericName: string;
  brandExamples: string[];
  category: string;
  schedule: TelemedicineDrugSchedule;
  dosageForm: "Tablet" | "Syrup" | "Capsule" | "Drops" | "Ointment" | "Sachet";
  janAushadhiPriceInr: number;
  brandAveragePriceInr: number;
  savingsPercent: number;
  standardDosage: string;
  safetyNote?: string;
};

export const JAN_AUSHADHI_CATALOG: JanAushadhiMedicine[] = [
  {
    id: "ja_pcm_650",
    genericName: "Paracetamol 650mg",
    brandExamples: ["Dolo 650", "Calpol 650", "Crocin 650", "P-650"],
    category: "Antipyretic / Analgesic",
    schedule: "ListA",
    dosageForm: "Tablet",
    janAushadhiPriceInr: 12,
    brandAveragePriceInr: 35,
    savingsPercent: 66,
    standardDosage: "1 गोली बुखार या बदन दर्द होने पर (दिन में अधिकतम 3 बार भोजन के बाद)",
    safetyNote: "24 घंटे में 4 ग्राम (6 गोलियों) से अधिक न लें। लिवर समस्या में डॉक्टर से पूछें।"
  },
  {
    id: "ja_amox_clav_625",
    genericName: "Amoxicillin + Potassium Clavulanate 625mg",
    brandExamples: ["Augmentin 625", "Moxikind-CV 625", "Clavam 625", "Advent 625"],
    category: "Broad Spectrum Antibiotic",
    schedule: "ListA",
    dosageForm: "Tablet",
    janAushadhiPriceInr: 35,
    brandAveragePriceInr: 185,
    savingsPercent: 81,
    standardDosage: "1 गोली सुबह और 1 गोली शाम भोजन के बाद (5 दिनों का पूरा कोर्स)",
    safetyNote: "एंटीबायोटिक का कोर्स बीच में न छोड़ें। पेनिसिलिन एलर्जी होने पर न लें।"
  },
  {
    id: "ja_panto_40",
    genericName: "Pantoprazole 40mg",
    brandExamples: ["Pan 40", "Pantocid 40", "Pantodac 40", "Protium 40"],
    category: "Antacid / Proton Pump Inhibitor",
    schedule: "ListA",
    dosageForm: "Tablet",
    janAushadhiPriceInr: 15,
    brandAveragePriceInr: 95,
    savingsPercent: 84,
    standardDosage: "1 गोली सुबह खाली पेट (नाश्ते से 30 मिनट पहले)",
    safetyNote: "लगातार एसिडिटी रहने पर खान-पान में तला-भुना कम करें।"
  },
  {
    id: "ja_panto_dom_d",
    genericName: "Pantoprazole 40mg + Domperidone 30mg (SR)",
    brandExamples: ["Pan-D", "Pantocid-D", "Pantodac-DSR", "Dompan"],
    category: "Gastro-resistant Antacid & Antiemetic",
    schedule: "ListA",
    dosageForm: "Capsule",
    janAushadhiPriceInr: 22,
    brandAveragePriceInr: 160,
    savingsPercent: 86,
    standardDosage: "1 कैप्सूल सुबह खाली पेट पानी के साथ",
    safetyNote: "एसिडिटी के साथ उल्टी या मतली महसूस होने पर उपयोगी।"
  },
  {
    id: "ja_azithro_500",
    genericName: "Azithromycin 500mg",
    brandExamples: ["Azithral 500", "Azee 500", "Zithrox 500", "Azimax 500"],
    category: "Macrolide Antibiotic",
    schedule: "ListA",
    dosageForm: "Tablet",
    janAushadhiPriceInr: 42,
    brandAveragePriceInr: 130,
    savingsPercent: 68,
    standardDosage: "1 गोली दिन में एक बार निश्चित समय पर (3 से 5 दिन)",
    safetyNote: "गले में गंभीर संक्रमण व श्वसन नली के बैक्टीरिया हेतु।"
  },
  {
    id: "ja_cefixime_200",
    genericName: "Cefixime 200mg",
    brandExamples: ["Zifi 200", "Taxim-O 200", "Mahacef 200", "Cefolac 200"],
    category: "Cephalosporin Antibiotic",
    schedule: "ListA",
    dosageForm: "Tablet",
    janAushadhiPriceInr: 45,
    brandAveragePriceInr: 165,
    savingsPercent: 73,
    standardDosage: "1 गोली सुबह व 1 गोली शाम भोजनोपरांत",
    safetyNote: "टाइफाइड, मूत्र संक्रमण (UTI) या श्वसन संक्रमण में प्रयुक्त।"
  },
  {
    id: "ja_cetirizine_10",
    genericName: "Cetirizine Hydrochloride 10mg",
    brandExamples: ["Cetcip 10", "Alerid 10", "Zyrtec", "Okacet"],
    category: "Antihistamine / Anti-allergy",
    schedule: "ListA",
    dosageForm: "Tablet",
    janAushadhiPriceInr: 6,
    brandAveragePriceInr: 25,
    savingsPercent: 76,
    standardDosage: "1 गोली रात को सोते समय आवश्यकतानुसार",
    safetyNote: "हल्की नींद आ सकती है; लेने के बाद वाहन न चलाएं।"
  },
  {
    id: "ja_levocet_mont_lc",
    genericName: "Levocetirizine 5mg + Montelukast 10mg",
    brandExamples: ["Montair-LC", "Montek-LC", "Telekast-L", "Levocet-M"],
    category: "Anti-allergic & Bronchodilator Support",
    schedule: "ListA",
    dosageForm: "Tablet",
    janAushadhiPriceInr: 28,
    brandAveragePriceInr: 180,
    savingsPercent: 84,
    standardDosage: "1 गोली रात को भोजन के बाद (5-7 दिन)",
    safetyNote: "एलर्जी जनित सर्दी, जुकाम और दमा/सांस की एलर्जी हेतु।"
  },
  {
    id: "ja_metformin_500",
    genericName: "Metformin Hydrochloride 500mg (SR)",
    brandExamples: ["Glycomet 500", "Glyciphage 500", "Obimet 500", "Cetapin 500"],
    category: "Oral Antidiabetic (Chronic Maintenance)",
    schedule: "ListB",
    dosageForm: "Tablet",
    janAushadhiPriceInr: 9,
    brandAveragePriceInr: 32,
    savingsPercent: 72,
    standardDosage: "1 गोली भोजन के साथ या तुरंत बाद (नियमित जांच सहित)",
    safetyNote: "केवल पहले से चल रहे शुगर के मरीज हेतु टेली-फॉलोअप में मान्य।"
  },
  {
    id: "ja_telmisartan_40",
    genericName: "Telmisartan 40mg",
    brandExamples: ["Telma 40", "Telmikind 40", "Telpres 40", "Cresar 40"],
    category: "Antihypertensive (Blood Pressure)",
    schedule: "ListB",
    dosageForm: "Tablet",
    janAushadhiPriceInr: 14,
    brandAveragePriceInr: 85,
    savingsPercent: 84,
    standardDosage: "1 गोली सुबह नाश्ते के बाद नियमित समय पर",
    safetyNote: "ब्लड प्रेशर की दवा को बिना डॉक्टर के कभी अचानक बंद न करें।"
  },
  {
    id: "ja_amlodipine_5",
    genericName: "Amlodipine 5mg",
    brandExamples: ["Amlong 5", "Stamlo 5", "Amlopin 5"],
    category: "Antihypertensive / Calcium Channel Blocker",
    schedule: "ListB",
    dosageForm: "Tablet",
    janAushadhiPriceInr: 6,
    brandAveragePriceInr: 38,
    savingsPercent: 84,
    standardDosage: "1 गोली दिन में एक बार",
    safetyNote: "पैरों में सूजन दिखे तो चिकित्सक को सूचित करें।"
  },
  {
    id: "ja_ors_sachet",
    genericName: "Oral Rehydration Salts (WHO Formula)",
    brandExamples: ["Electral", "Enerzal", "Prolyte ORS", "Walyte"],
    category: "Electrolyte Rehydrant",
    schedule: "ListA",
    dosageForm: "Sachet",
    janAushadhiPriceInr: 10,
    brandAveragePriceInr: 24,
    savingsPercent: 58,
    standardDosage: "1 पैकेट को 1 लीटर उबले व ठंडे पानी में घोलकर 24 घंटे में पिएं",
    safetyNote: "दस्त, उल्टी या डिहाइड्रेशन में सबसे जरूरी जीवनरक्षक घोल।"
  },
  {
    id: "ja_combiflam",
    genericName: "Ibuprofen 400mg + Paracetamol 325mg",
    brandExamples: ["Combiflam", "Flexon", "Brufen Plus"],
    category: "Pain Reliever & Anti-inflammatory",
    schedule: "ListA",
    dosageForm: "Tablet",
    janAushadhiPriceInr: 10,
    brandAveragePriceInr: 42,
    savingsPercent: 76,
    standardDosage: "1 गोली भोजन के बाद दर्द होने पर",
    safetyNote: "खाली पेट कभी न लें। पेट में अल्सर या एसिडिटी में सावधानी बरतें।"
  },
  {
    id: "ja_oflox_oz",
    genericName: "Ofloxacin 200mg + Ornidazole 500mg",
    brandExamples: ["O2", "Zenflox-OZ", "Oflomac-OZ", "Ornof"],
    category: "Gastrointestinal Antimicrobial",
    schedule: "ListA",
    dosageForm: "Tablet",
    janAushadhiPriceInr: 32,
    brandAveragePriceInr: 135,
    savingsPercent: 76,
    standardDosage: "1 गोली सुबह और शाम भोजन के बाद (3 से 5 दिन)",
    safetyNote: "दस्त, पेट मरोड़ व पेचिश संक्रमण हेतु प्रयुक्त।"
  },
  {
    id: "ja_multivitamin_zinc",
    genericName: "Multivitamin with B-Complex & Zinc",
    brandExamples: ["Becosules", "Zincovit", "A to Z NS", "Supradyn"],
    category: "Nutritional Supplement",
    schedule: "ListA",
    dosageForm: "Capsule",
    janAushadhiPriceInr: 18,
    brandAveragePriceInr: 115,
    savingsPercent: 84,
    standardDosage: "1 कैप्सूल प्रतिदिन दोपहर के भोजन के बाद",
    safetyNote: "कमजोरी, मुंह के छाले व बीमारी के बाद रिकवरी में सहायक।"
  }
];

export const PROHIBITED_TELEMEDICINE_DRUGS = [
  "alprazolam",
  "clonazepam",
  "diazepam",
  "lorazepam",
  "zolpidem",
  "chlordiazepoxide",
  "nitrazepam",
  "morphine",
  "codeine",
  "fentanyl",
  "tramadol",
  "ketamine",
  "buprenorphine",
  "methadone",
  "pentazocine",
  "midazolam",
  "phenobarbitone",
  "methylphenidate",
  "sleeping pill",
  "narcotic"
];

/**
 * Find matching Jan Aushadhi generic equivalents based on medicine query or brand name
 */
export function findJanAushadhiEquivalents(query: string): JanAushadhiMedicine[] {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  return JAN_AUSHADHI_CATALOG.filter((med) => {
    if (med.genericName.toLowerCase().includes(q)) return true;
    if (med.category.toLowerCase().includes(q)) return true;
    return med.brandExamples.some((b) => b.toLowerCase().includes(q) || q.includes(b.toLowerCase()));
  });
}

/**
 * Validate prescription safety and statutory compliance under Telemedicine Practice Guidelines (2020)
 */
export function validatePrescriptionDrugs(medicinesText: string): {
  isCompliant: boolean;
  prohibitedDrugsFound: string[];
  recommendations: JanAushadhiMedicine[];
  estimatedSavingsInr: number;
  warningMessage?: string;
} {
  const lower = medicinesText.toLowerCase();

  // 1. Scan for Schedule X / Prohibited substances
  const prohibitedFound = PROHIBITED_TELEMEDICINE_DRUGS.filter((prohibited) =>
    lower.includes(prohibited.toLowerCase())
  );

  if (prohibitedFound.length > 0) {
    return {
      isCompliant: false,
      prohibitedDrugsFound: prohibitedFound,
      recommendations: [],
      estimatedSavingsInr: 0,
      warningMessage: `सांविधिक चेतावनी (Statutory Rejection): '${prohibitedFound.join(", ")}' Schedule X / नशीली/नींद की दवाओं की श्रेणी में आती है। टेलीमेडिसिन दिशा-निर्देश 2020 के अनुसार ऑनलाइन पर्चे पर यह दवा लिखना कानूनी रूप से पूर्णतः प्रतिबंधित है। मरीज़ को प्रत्यक्ष क्लिनिक में जांच हेतु निर्देशित करें।`
    };
  }

  // 2. Identify generic Jan Aushadhi alternatives mentioned in prescription
  const matchedMeds: JanAushadhiMedicine[] = [];
  let totalSavings = 0;

  for (const item of JAN_AUSHADHI_CATALOG) {
    const isGenericPresent = lower.includes(item.genericName.toLowerCase().split(" ")[0]);
    const isBrandPresent = item.brandExamples.some((brand) => lower.includes(brand.toLowerCase()));

    if (isGenericPresent || isBrandPresent) {
      matchedMeds.push(item);
      totalSavings += Math.max(0, item.brandAveragePriceInr - item.janAushadhiPriceInr);
    }
  }

  return {
    isCompliant: true,
    prohibitedDrugsFound: [],
    recommendations: matchedMeds,
    estimatedSavingsInr: totalSavings
  };
}

// ---------------------------------------------------------
// Brand & Statutory Enterprise Constants
// ---------------------------------------------------------
export const BRAND_CONSTANTS = {
  BRAND_NAME: "NeighbourDoc",
  BRAND_TAGLINE: "हर परिवार के लिए विश्वसनीय डॉक्टर, 15 मिनट में",
  CORPORATE_ENTITY: "Qsura India Pvt. Ltd.",
  LEGAL_OWNER: "Qsura India Pvt. Ltd.",
  FOUNDER_AND_ARCHITECT: "Dr. Irfan Ashraf",
  PROPRIETARY_NOTICE: "Proprietary software of Qsura India Pvt. Ltd. Founded & Architected by Dr. Irfan Ashraf.",
  SLA_GUARANTEE_MINUTES: 15,
  SUPPORT_PHONE: "+918000000000",
  SUPPORT_EMAIL: "support@neighbourdoc.in",
  EMERGENCY_HELPLINES: {
    nationalEmergency: "112",
    ambulance: "108",
    poisonControl: "1800-116-117",
    womenHelpline: "1090"
  }
} as const;

export type BrandConstants = typeof BRAND_CONSTANTS;


