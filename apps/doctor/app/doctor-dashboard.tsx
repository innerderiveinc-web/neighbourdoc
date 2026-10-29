"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard, PrimaryButton, Surface } from "@neighbourdoc/ui";
import { DoctorHeader, type DoctorProfile } from "../components/DoctorHeader";
import { PatientQueueList, type ConsultationItem } from "../components/PatientQueueList";
import { JanAushadhiRxCopilot } from "../components/JanAushadhiRxCopilot";
import { ActiveCallModal } from "../components/ActiveCallModal";
import type { JanAushadhiMedicine } from "@neighbourdoc/shared";

export function DoctorDashboardClient() {
  // Authentication State
  const [sessionUser, setSessionUser] = useState<{ name: string; phone: string } | null>(null);
  const [loginPhone, setLoginPhone] = useState("+919800000001");
  const [loginOtp, setLoginOtp] = useState("123456");
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState("");

  // Dashboard Data State
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [medicines, setMedicines] = useState(
    "Paracetamol 500mg (1-0-1 खाने के बाद) x 3 दिन\nCetirizine 10mg (0-0-1 रात को) x 3 दिन"
  );
  const [advice, setAdvice] = useState(
    "पर्याप्त मात्रा में गुनगुना पानी पिएं और आराम करें। यदि 48 घंटे में बुखार न उतरे तो नज़दीकी क्लिनिक में दिखाएं।"
  );
  const [notice, setNotice] = useState("तैयार हैं।");
  const [medSearch, setMedSearch] = useState("");

  // Active Call Cockpit Modal State
  const [activeCallModal, setActiveCallModal] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "dialing" | "connected" | "ended">("idle");
  const [callSeconds, setCallSeconds] = useState(0);

  const currentDoctor = useMemo(() => {
    if (!sessionUser) return doctors[0] ?? null;
    return doctors.find((d) => d.phone === sessionUser.phone) ?? doctors[0] ?? null;
  }, [doctors, sessionUser]);

  const queue = useMemo(
    () =>
      consultations.filter(
        (item) =>
          item.paymentStatus === "paid" &&
          item.status !== "completed" &&
          (!currentDoctor || item.doctorId === currentDoctor.id || item.status === "queued")
      ),
    [consultations, currentDoctor]
  );

  const selected = queue.find((item) => item.id === selectedId) ?? queue[0];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeCallModal && callStatus === "connected") {
      interval = setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCallModal, callStatus]);

  function getDoctorToken() {
    return localStorage.getItem("neighbourdoc_doctor_token") || localStorage.getItem("neighbordoc_doctor_token");
  }

  async function refresh() {
    const token = getDoctorToken();
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [doctorsResponse, consultationsResponse] = await Promise.all([
        fetch("/api/doctors", { headers }),
        fetch("/api/consultations", { headers })
      ]);
      if (doctorsResponse.ok) setDoctors(await doctorsResponse.json());
      if (consultationsResponse.ok) setConsultations(await consultationsResponse.json());
      setNotice(`कतार सिंक: ${new Date().toLocaleTimeString("hi-IN")}`);
    } catch {
      setNotice("डेटा सिंक त्रुटि।");
    }
  }

  useEffect(() => {
    const token = getDoctorToken();
    const storedUser = localStorage.getItem("neighbourdoc_doctor_user");
    if (token && storedUser) {
      try {
        setSessionUser(JSON.parse(storedUser));
        refresh();
        const timer = setInterval(refresh, 8000);
        return () => clearInterval(timer);
      } catch {
        localStorage.removeItem("neighbourdoc_doctor_user");
      }
    }
  }, []);

  async function handleSendOtp() {
    setAuthError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone, role: "doctor" })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "OTP भेजने में विफलता।");
        return;
      }
      setOtpSent(true);
    } catch {
      setAuthError("सर्वर से कनेक्ट करने में त्रुटि।");
    }
  }

  async function handleVerifyOtp(overridePhone?: string, overrideCode?: string) {
    setAuthError("");
    const phone = overridePhone ?? loginPhone;
    const code = overrideCode ?? loginOtp;

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "OTP सत्यापन असफल रहा।");
        return;
      }
      if (data.role !== "doctor") {
        setAuthError("अनाधिकृत प्रवेश: यह पोर्टल केवल सत्यापित चिकित्सकों के लिए है।");
        return;
      }

      localStorage.setItem("neighbourdoc_doctor_token", data.sessionToken);
      const userObj = { name: data.name ?? "डॉ. प्रिया शर्मा", phone: data.phone };
      localStorage.setItem("neighbourdoc_doctor_user", JSON.stringify(userObj));
      setSessionUser(userObj);
      refresh();
    } catch {
      setAuthError("सत्यापन अनुरोध विफल रहा।");
    }
  }

  function handleLogout() {
    localStorage.removeItem("neighbourdoc_doctor_token");
    localStorage.removeItem("neighbordoc_doctor_token");
    localStorage.removeItem("neighbourdoc_doctor_user");
    setSessionUser(null);
    setOtpSent(false);
  }

  async function toggleAvailability() {
    if (!currentDoctor) return;
    const next = currentDoctor.availabilityStatus === "online" ? "offline" : "online";
    const token = getDoctorToken();
    await fetch(`/api/doctors/${currentDoctor.id}/availability`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ availabilityStatus: next })
    });
    await refresh();
  }

  async function startConsultation(id: string) {
    setSelectedId(id);
    const token = getDoctorToken();
    const authHeaders = {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    await fetch(`/api/consultations/${id}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status: "in_consultation" })
    });

    // Initiate telephony click-to-call bridge
    void fetch("/api/telephony/call-bridge", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ consultationId: id, doctorPhone: currentDoctor?.phone })
    }).catch(() => {});

    setActiveCallModal(true);
    setCallStatus("dialing");
    setCallSeconds(0);
    setTimeout(() => {
      setCallStatus("connected");
    }, 1500);
    await refresh();
  }

  async function completeConsultation() {
    if (!selected) return;
    const token = getDoctorToken();
    const dynamicFollowUp = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
    await fetch(`/api/consultations/${selected.id}/complete`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ medicines, advice, followUpDate: dynamicFollowUp })
    });
    setActiveCallModal(false);
    setCallStatus("ended");
    setNotice(`टोकन ${selected.id} का पर्चा तैयार हो गया और मरीज़ को भेज दिया गया।`);
    await refresh();
  }

  async function createDemoPatient() {
    const bookingResponse = await fetch("/api/consultations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "राजेश वर्मा",
        phone: "+919711000001",
        age: 34,
        gender: "male",
        city: "लखनऊ",
        language: "Hindi",
        symptoms: "2 दिन से बुखार और बदन दर्द",
        existingIllnesses: "कोई पूर्व बीमारी नहीं",
        plan: "basic",
        consent: true,
        referralSource: "doctor_demo"
      })
    });
    const booking = await bookingResponse.json();
    if (!booking.ok) {
      setNotice(booking.error ?? "डेमो मरीज़ जोड़ने में असमर्थ।");
      return;
    }
    const orderResponse = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: "basic", consultationId: booking.consultation.id })
    });
    const order = await orderResponse.json();
    await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        consultationId: booking.consultation.id,
        orderId: order.orderId,
        gatewayPaymentId: `pay_demo_${Date.now()}`
      })
    });
    await refresh();
  }

  const handleAppendJanAushadhi = (med: JanAushadhiMedicine) => {
    const formatted = `${med.genericName} (${med.standardDosage})`;
    setMedicines((prev) => (prev ? `${prev.trim()}\n${formatted}` : formatted));
    setMedSearch("");
    setNotice(`✓ जन औषधि जेनेरिक '${med.genericName}' पर्चे में जोड़ा गया (बचत: ~${med.savingsPercent}%)`);
  };

  // Login Gate
  if (!sessionUser) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <Surface className="border-[#D1E6E3] shadow-[0_10px_30px_-5px_rgba(11,79,72,0.08)]">
          <div className="text-center">
            <span className="inline-block rounded-full bg-[#E8F3F1] px-3 py-1 text-xs font-bold text-[#0B4F48]">
              चिकित्सक सत्यापन पोर्टल
            </span>
            <h1 className="mt-3 text-2xl font-black text-[#0F2F2E]">NeighbourDoc डॉक्टर पोर्टल</h1>
            <p className="mt-1 text-xs text-[#64748B]">रजिस्टर्ड मोबाइल नंबर और OTP से साइन इन करें</p>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#334155]">मोबाइल नंबर (+91 सहित)</label>
              <input
                className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="+919800000001"
              />
            </div>

            {otpSent && (
              <div>
                <label className="text-xs font-bold text-[#334155]">6-अंकों का OTP दर्ज करें</label>
                <input
                  className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-center text-lg font-black tracking-widest text-[#0B4F48] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                  value={loginOtp}
                  onChange={(e) => setLoginOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
            )}

            {authError && <p className="text-xs font-bold text-red-600">{authError}</p>}

            {!otpSent ? (
              <PrimaryButton onClick={handleSendOtp} className="w-full">
                लॉगिन OTP भेजें
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => handleVerifyOtp()} className="w-full">
                OTP सत्यापित करें व प्रवेश करें
              </PrimaryButton>
            )}

            <div className="mt-4 border-t border-[#F1F5F9] pt-4 text-center">
              <p className="text-[11px] font-bold text-[#64748B]">त्वरित डेमो लॉगिन:</p>
              <div className="mt-2 flex flex-col gap-2">
                <button
                  onClick={() => handleVerifyOtp("+919800000001", "123456")}
                  className="rounded-xl border border-[#D1E6E3] bg-[#F0F7F6] px-3 py-2 text-xs font-black text-[#0B4F48] hover:bg-[#E2EFECEB] transition"
                >
                  👨‍⚕️ डॉ. प्रिया शर्मा (जनरल फिजिशियन · लखनऊ)
                </button>
                <button
                  onClick={() => handleVerifyOtp("+919800000002", "123456")}
                  className="rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-black text-[#334155] hover:bg-[#F8FAFC] transition"
                >
                  👨‍⚕️ डॉ. राहुल वर्मा (सीनियर कंसल्टेंट · कानपुर)
                </button>
              </div>
            </div>
          </div>
        </Surface>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <DoctorHeader
        doctor={currentDoctor}
        onAddDemoPatient={createDemoPatient}
        onToggleAvailability={toggleAvailability}
        onLogout={handleLogout}
      />

      <p className="mt-3 text-xs font-bold text-[#107569]">{notice}</p>

      {/* Metrics Row */}
      <section className="mt-5 grid gap-4 sm:grid-cols-3">
        <MetricCard label="कतार में मरीज़" value={String(queue.length)} tone={queue.length > 0 ? "amber" : "green"} />
        <MetricCard label="आज पूरे किए परामर्श" value={String(currentDoctor?.callsToday ?? 0)} tone="green" />
        <MetricCard label="आज की कुल कमाई" value={`₹${currentDoctor?.earnedToday ?? 0}`} tone="teal" />
      </section>

      {/* Main Grid: Queue & Prescription Form */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <PatientQueueList
          queue={queue}
          selectedId={selected?.id ?? null}
          onRefresh={refresh}
          onStartConsultation={startConsultation}
          onEscalate={(id) => setNotice(`टोकन ${id} को सीनियर रिव्यू के लिए चिह्नित किया गया।`)}
        />

        <JanAushadhiRxCopilot
          medicines={medicines}
          advice={advice}
          medSearch={medSearch}
          canComplete={Boolean(selected)}
          onMedicinesChange={setMedicines}
          onAdviceChange={setAdvice}
          onMedSearchChange={setMedSearch}
          onAppendJanAushadhi={handleAppendJanAushadhi}
          onCompleteConsultation={completeConsultation}
        />
      </section>

      <ActiveCallModal
        isOpen={activeCallModal}
        consultation={selected ?? null}
        callStatus={callStatus}
        callSeconds={callSeconds}
        medicines={medicines}
        advice={advice}
        onMedicinesChange={setMedicines}
        onAdviceChange={setAdvice}
        onAppendJanAushadhi={handleAppendJanAushadhi}
        onClose={() => setActiveCallModal(false)}
        onCompleteConsultation={completeConsultation}
      />

      <footer className="mt-8 border-t border-[#E2E8F0] pt-4 text-center text-xs text-[#94A3B8]">
        NeighbourDoc Telehealth Clinical Suite · Proprietary Asset of <strong>Qsura India Pvt. Ltd.</strong> · Founder &amp; Chief Architect: <strong>Dr. Irfan Ashraf</strong>
      </footer>
    </main>
  );
}
