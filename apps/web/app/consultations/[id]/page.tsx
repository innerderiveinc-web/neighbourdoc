"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Surface, PrimaryButton } from "@neighbourdoc/ui";

type Consultation = {
  id: string;
  patientId: string;
  doctorId: string | null;
  symptoms: string;
  urgencyLevel: string;
  status: string;
  paymentStatus: string;
  plan: string;
  callbackDeadline: string | null;
  createdAt: string;
};

type Doctor = {
  id: string;
  name: string;
  qualification: string;
  specialization: string;
  registrationNumber: string;
  city: string;
};

export default function ConsultationStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>("गणना हो रही है...");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("neighbourdoc_patient_token") ||
              localStorage.getItem("neighbourdoc_doctor_token") ||
              localStorage.getItem("neighbourdoc_admin_token")
            : null;
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const cRes = await fetch(`/api/consultations/${id}`, { headers });
        if (!cRes.ok) {
          setError("परामर्श रिकॉर्ड नहीं मिला या अनधिकृत पहुंच (Unauthorized)। कृपया टोकन जांचें।");
          return;
        }

        const cData = await cRes.json();
        setConsultation(cData);

        if (cData.doctorId) {
          const dRes = await fetch(`/api/doctors/${cData.doctorId}`);
          if (dRes.ok) {
            const dData = await dRes.json();
            if (dData && !dData.error) {
              setDoctor(dData);
            }
          }
        }
      } catch {
        setError("डेटा लोड करने में असमर्थ। कृपया कनेक्शन जांचें।");
      } finally {
        setLoading(false);
      }
    }

    void loadData();

    const interval = setInterval(() => {
      void loadData();
    }, 4000);

    return () => clearInterval(interval);
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!consultation?.callbackDeadline) return;

    const interval = setInterval(() => {
      const deadline = new Date(consultation.callbackDeadline!).getTime();
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft("समय पूरा हो चुका है — डॉक्टर शीघ्र कनेक्ट कर रहे हैं");
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins} मिनट ${secs < 10 ? "0" : ""}${secs} सेकंड`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [consultation]);

  if (loading) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#0B4F48] border-t-transparent"></div>
        <p className="mt-4 text-sm font-bold text-[#4A5568]">परामर्श स्थिति (Status) जांची जा रही है...</p>
      </main>
    );
  }

  if (error || !consultation) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
          <p className="text-base font-bold">{error || "परामर्श विवरण अनुपलब्ध है।"}</p>
          <div className="mt-4">
            <Link
              href="/"
              className="inline-block rounded-xl bg-[#0B4F48] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#083E38]"
            >
              होमपेज पर वापस जाएं
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isCompleted = consultation.status === "completed";

  return (
    <div className="min-h-screen bg-[#FAFBF9] py-8 px-4 sm:px-6">
      <main className="mx-auto max-w-xl">
        <div className="mb-4">
          <Link href="/" className="text-xs font-bold text-[#0B4F48] hover:underline">
            &larr; NeighbourDoc होमपेज
          </Link>
        </div>

        <Surface className="border-[#D1E6E3] shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#E9ECEF] pb-4">
            <div>
              <span className="rounded-md bg-[#E8F3F1] px-2.5 py-0.5 text-xs font-bold text-[#0B4F48]">
                टोकन: {consultation.id}
              </span>
              <h1 className="mt-2 text-xl font-black text-[#0F2F2E]">
                {isCompleted ? "परामर्श पूरा हो चुका है" : "डॉक्टर कॉलबैक कतार"}
              </h1>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
              isCompleted
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800 animate-pulse"
            }`}>
              {isCompleted ? "पूर्ण (Completed)" : "सक्रिय (In Queue)"}
            </span>
          </div>

          {/* SLA Countdown Timer */}
          {!isCompleted && (
            <div className="mt-5 rounded-2xl border border-[#D1E6E3] bg-[#F2F8F7] p-5 text-center">
              <p className="text-xs font-bold text-[#64748B]">डॉक्टर कॉलबैक समय-सीमा (15-Min SLA):</p>
              <p className="mt-1 text-2xl font-black font-mono text-[#0B4F48]">{timeLeft}</p>
              <p className="mt-2 text-[11px] text-[#475569]">
                डॉक्टर सीधे आपके मोबाइल नंबर पर फोन करेंगे। कृपया फोन की घंटी का ध्यान रखें।
              </p>
            </div>
          )}

          {/* Details Card */}
          <div className="mt-5 space-y-3 text-xs">
            <div className="flex justify-between border-b border-[#F1F5F9] pb-2">
              <span className="text-[#64748B]">तकलीफ़ / लक्षण:</span>
              <span className="font-bold text-[#0F2F2E] text-right">{consultation.symptoms}</span>
            </div>

            <div className="flex justify-between border-b border-[#F1F5F9] pb-2">
              <span className="text-[#64748B]">प्लान / फीस स्थिति:</span>
              <span className="font-bold text-emerald-700 capitalize">
                {consultation.plan === "priority" ? "Priority (₹99)" : "Basic (₹49)"} · {consultation.paymentStatus}
              </span>
            </div>

            <div className="flex justify-between border-b border-[#F1F5F9] pb-2">
              <span className="text-[#64748B]">असाइंड डॉक्टर:</span>
              <span className="font-bold text-[#0F2F2E]">
                {doctor?.name ?? "डॉ. प्रिया शर्मा (MBBS, KGMU)"}
              </span>
            </div>

            {doctor?.registrationNumber && (
              <div className="flex justify-between border-b border-[#F1F5F9] pb-2">
                <span className="text-[#64748B]">NMC रजिस्ट्रेशन नंबर:</span>
                <span className="font-mono font-bold text-[#0B4F48]">{doctor.registrationNumber}</span>
              </div>
            )}
          </div>

          {/* Action Links */}
          <div className="mt-6 pt-4 border-t border-[#E9ECEF] space-y-2.5">
            <Link
              href={`/consultations/${consultation.id}/prescription`}
              className="block w-full text-center rounded-xl bg-[#0B4F48] py-3 text-xs font-black text-white hover:bg-[#083E38] shadow transition"
            >
              📄 डिजिटल पर्चा (Rx) देखें व डाउनलोड करें &rarr;
            </Link>

            {isCompleted && (
              <Link
                href={`/consultations/${consultation.id}/feedback`}
                className="block w-full text-center rounded-xl border border-[#0B4F48] bg-[#F0F7F6] py-2.5 text-xs font-bold text-[#0B4F48] hover:bg-[#E2EFECEB] transition"
              >
                ⭐ डॉक्टर परामर्श अनुभव व रेटिंग साझा करें
              </Link>
            )}

            <Link
              href="/contact"
              className="block w-full text-center rounded-xl border border-[#CBD5E1] bg-white py-2.5 text-xs font-bold text-[#475569] hover:bg-[#F8FAFC] transition"
            >
              सहायता केंद्र / रिफंड सहायता
            </Link>
          </div>
        </Surface>

        {/* Emergency Card */}
        <div className="mt-4 rounded-2xl border border-[#FECDD3] bg-[#FFF1F2] p-4 text-xs text-[#9F1239]">
          <p className="font-bold">⚠️ यदि प्रतीक्षा के दौरान स्थिति अचानक बिगड़े:</p>
          <p className="mt-0.5">तुरंत <strong>112 डायल करें</strong> या नज़दीकी आपातकालीन अस्पताल जाएं।</p>
        </div>
      </main>
    </div>
  );
}
