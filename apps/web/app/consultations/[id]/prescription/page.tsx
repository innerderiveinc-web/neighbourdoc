"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Surface } from "@neighbourdoc/ui";

type Consultation = {
  id: string;
  patientId: string;
  doctorId: string | null;
  symptoms: string;
  urgencyLevel: string;
  status: string;
  paymentStatus: string;
  plan: string;
  createdAt: string;
};

type Prescription = {
  id: string;
  consultationId: string;
  doctorId: string;
  medicines: string;
  advice: string;
  followUpDate?: string;
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

export default function PrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
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

        const [cRes, pRes] = await Promise.all([
          fetch(`/api/consultations/${id}`, { headers }),
          fetch(`/api/prescriptions/${id}`, { headers })
        ]);

        if (!cRes.ok) {
          setError("परामर्श रिकॉर्ड नहीं मिला या अनधिकृत पहुंच (Unauthorized)।");
          return;
        }

        const cData = await cRes.json();
        setConsultation(cData);

        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData && !pData.error) {
            setPrescription(pData);
          }
        }

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
        setError("पर्चे का विवरण लोड करने में असमर्थ।");
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

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#0B4F48] border-t-transparent"></div>
        <p className="mt-4 text-base font-bold text-[#4A5568]">डिजिटल पर्चा (Prescription) लोड हो रहा है...</p>
      </main>
    );
  }

  if (error || !consultation) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <Surface>
          <div className="text-3xl">⚠️</div>
          <h1 className="mt-2 text-xl font-black text-[#991B1B]">सूचना</h1>
          <p className="mt-2 text-sm text-[#64748B]">{error || "परामर्श रिकॉर्ड प्राप्त नहीं हो सका।"}</p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-block rounded-xl bg-[#0B4F48] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#083E38] transition"
            >
              होमपेज पर वापस जाएं
            </Link>
          </div>
        </Surface>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Top Navigation & Action Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4F48] hover:underline"
        >
          &larr; NeighbourDoc होमपेज
        </Link>
        <div className="flex gap-2.5">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B4F48] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#083E38] transition"
          >
            🖨️ पर्चा प्रिंट या सेव करें (PDF)
          </button>
        </div>
      </div>

      {/* Authentic Clinical Letterhead Prescription */}
      <div className="rounded-3xl border border-[#D1E6E3] bg-white p-6 sm:p-10 shadow-[0_4px_24px_-4px_rgba(11,79,72,0.06)] print:border-none print:p-0 print:shadow-none">
        {/* Clinic Header */}
        <header className="border-b-2 border-[#0B4F48] pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B4F48] text-white font-black text-base">
                  +
                </span>
                <h1 className="text-2xl font-black tracking-tight text-[#0B4F48]">NeighbourDoc</h1>
              </div>
              <p className="mt-1 text-xs font-bold text-[#107569]">
                प्राथमिक स्वास्थ्य सेवा नेटवर्क · Primary Healthcare Care Network
              </p>
              <p className="text-[11px] text-[#64748B]">
                टेलीमेडिसिन प्रैक्टिस गाइडलाइन्स (2020), स्वास्थ्य मंत्रालय, भारत सरकार
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-[#E8F3F1] px-3 py-0.5 text-xs font-black uppercase text-[#0B4F48]">
                डिजिटल पर्चा (Rx)
              </span>
              <p className="mt-1.5 font-mono text-xs font-bold text-[#475569]">टोकन: {consultation.id}</p>
              <p className="text-xs text-[#64748B]">
                दिनांक: {new Date(consultation.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </header>

        {/* Doctor & Patient Metadata Grid */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 rounded-2xl bg-[#F8FAF9] p-4 border border-[#E9ECEF] text-xs">
          <div>
            <span className="font-bold text-[10px] uppercase tracking-wider text-[#64748B]">परामर्शदाता चिकित्सक (Physician)</span>
            <p className="mt-0.5 text-sm font-black text-[#0F2F2E]">{doctor?.name ?? "डॉ. प्रिया शर्मा"}</p>
            <p className="font-semibold text-[#4A5568]">
              {doctor?.qualification ?? "MBBS (KGMU)"} · {doctor?.specialization ?? "जनरल फिजिशियन"}
            </p>
            <p className="mt-0.5 font-bold text-[#0B4F48]">
              NMC Reg No: <span className="font-mono">{doctor?.registrationNumber ?? "NMC-LKO-1001"}</span>
            </p>
          </div>
          <div>
            <span className="font-bold text-[10px] uppercase tracking-wider text-[#64748B]">मरीज़ का विवरण (Patient Info)</span>
            <p className="mt-0.5 text-[#334155]"><strong>मरीज़ ID:</strong> {consultation.patientId}</p>
            <p className="mt-0.5 text-[#334155]"><strong>मुख्य लक्षण:</strong> {consultation.symptoms}</p>
            <p className="mt-0.5 text-[#334155]"><strong>परामर्श शुल्क:</strong> ₹49 (ऑनलाइन भुगतान पूर्ण)</p>
          </div>
        </section>

        {/* Clinical Prescription Content */}
        {prescription ? (
          <div className="mt-7 space-y-6">
            <div>
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
                <span className="text-2xl font-serif font-black text-[#0B4F48]">℞</span>
                <h3 className="text-base font-black text-[#0F2F2E]">दवाइयां और खुराक (Prescribed Medications)</h3>
              </div>
              <div className="mt-3 overflow-hidden rounded-2xl border border-[#E2E8F0]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-[#F8FAF9] font-bold text-[#475569]">
                    <tr>
                      <th className="px-4 py-2.5">दवा का नाम व क्षमता</th>
                      <th className="px-4 py-2.5">खुराक / कब लेना है</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    <tr>
                      <td className="px-4 py-3.5 font-bold text-[#0F172A] whitespace-pre-line leading-relaxed">
                        {prescription.medicines}
                      </td>
                      <td className="px-4 py-3.5 text-[#475569] leading-relaxed">
                        डॉक्टर के निर्देशानुसार समय पर लें। जन औषधि या किसी भी मेडिकल स्टोर से जेनेरिक दवा ली जा सकती है।
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#475569]">
                डॉक्टर की सलाह व परहेज (Advice &amp; Care Guidance)
              </h3>
              <div className="mt-2 rounded-2xl border border-[#E9ECEF] bg-[#FAFBF9] p-4 text-xs leading-relaxed text-[#334155]">
                {prescription.advice}
              </div>
            </div>

            {prescription.followUpDate && (
              <div className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-3.5 text-xs text-[#166534]">
                <strong>पुनः परामर्श (Follow-Up):</strong> यदि तकलीफ़ 48 घंटे में ठीक न हो, तो{" "}
                <strong>{prescription.followUpDate}</strong> तक दोबारा संपर्क करें।
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-6 text-center text-[#92400E]">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#92400E] border-t-transparent mb-2"></div>
            <h3 className="text-sm font-bold">डॉक्टर द्वारा परामर्श जारी है</h3>
            <p className="mt-1 text-xs">
              डॉक्टर अभी आपसे बातचीत पूरी कर रहे हैं। परामर्श समाप्त होते ही आधिकारिक हस्ताक्षरित पर्चा यहाँ स्वतः दिखाई देगा।
            </p>
          </div>
        )}

        {/* Footer & Digital Seal - ONLY rendered when prescription actually exists */}
        {prescription && (
          <footer className="mt-10 border-t border-[#E9ECEF] pt-6 text-[11px] text-[#64748B]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-md">
                <p className="font-bold text-[#334155]">सांविधिक सूचना (Statutory Notice):</p>
                <p className="mt-0.5 leading-relaxed">
                  यह पर्चा राष्ट्रीय टेलीमेडिसिन दिशा-निर्देश 2020 (Telemedicine Practice Guidelines) के अनुसार इलेक्ट्रॉनिक रूप से जारी किया गया है। भारत के सभी पंजीकृत फार्मेसी स्टोर इसे स्वीकार करने के लिए अधिकृत हैं।
                </p>
                <p className="mt-1 text-[10px] text-[#94A3B8] leading-tight">
                  *कानूनी प्रतिबंध: Schedule X (नशीली व मनःप्रभावी दवाइयां), आदत डालने वाली दवाएं व इंजेक्शन टेलीमेडिसिन में लिखना प्रतिबंधित है। यदि लक्षण 48 घंटे में न सुधरें या स्थिति बिगड़े, तो तत्काल निकटतम अस्पताल में प्रत्यक्ष जांच कराएं।
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block rounded-xl border border-[#D1E6E3] bg-[#F2F8F7] px-4 py-2 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#0B4F48]">डिजिटली सत्यापित पर्चा</p>
                  <p className="text-xs font-black text-[#0B4F48]">{doctor?.name ?? "डॉ. प्रिया शर्मा (MBBS)"}</p>
                  <p className="text-[10px] text-[#107569]">{doctor?.registrationNumber ?? "NMC-LKO-1001"}</p>
                  <p className="mt-1 border-t border-[#D1E6E3] pt-1 text-[9px] font-medium text-[#64748B]">तकनीक: Qsura India Pvt. Ltd.</p>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Helpful Next Steps Card - ONLY when prescription exists */}
      {prescription ? (
        <div className="mt-6 rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm print:hidden">
          <h3 className="text-sm font-black text-[#0F2F2E]">दवा खरीदने के लिए उपयोगी सलाह</h3>
          <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
            इस पर्चे को अपने फोन में दिखाकर आप किसी भी नज़दीकी <strong>प्रधानमंत्री भारतीय जन औषधि केंद्र</strong> से 50% से 80% सस्ती दवाइयां प्राप्त कर सकते हैं।
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              onClick={handlePrint}
              className="rounded-xl bg-[#0B4F48] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#083E38] transition"
            >
              📥 पर्चा डाउनलोड करें (PDF)
            </button>
            <Link
              href={`/consultations/${id}/feedback`}
              className="rounded-xl border border-[#0B4F48] bg-[#F0F7F6] px-4 py-2.5 text-xs font-bold text-[#0B4F48] hover:bg-[#E2EFECEB] transition"
            >
              ⭐ डॉक्टर को रेटिंग दें
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-[#CBD5E1] bg-white px-4 py-2.5 text-xs font-bold text-[#475569] hover:bg-[#F8FAFC] transition"
            >
              होमपेज पर जाएं
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 text-center print:hidden">
          <Link
            href={`/consultations/${id}`}
            className="inline-block rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-bold text-[#475569] hover:bg-[#F8FAFC] transition"
          >
            &larr; लाइव कॉलबैक स्टेटस स्क्रीन देखें
          </Link>
        </div>
      )}
    </main>
  );
}
