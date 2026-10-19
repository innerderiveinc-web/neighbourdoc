"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard, PrimaryButton, Surface } from "@neighbourdoc/ui";

type Doctor = {
  id: string;
  name: string;
  phone: string;
  qualification?: string;
  specialization?: string;
  registrationNumber?: string;
  availabilityStatus: "online" | "offline" | "busy";
  earnedToday: number;
  callsToday: number;
};

type Consultation = {
  id: string;
  patientId: string;
  doctorId: string | null;
  symptoms: string;
  urgencyLevel: string;
  status: string;
  paymentStatus: string;
  callbackDeadline: string | null;
  createdAt: string;
  plan?: string;
  amount?: number;
};

export function DoctorDashboardClient() {
  // Authentication State
  const [sessionUser, setSessionUser] = useState<{ name: string; phone: string } | null>(null);
  const [loginPhone, setLoginPhone] = useState("+919800000001");
  const [loginOtp, setLoginOtp] = useState("123456");
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState("");

  // Dashboard Data State
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [medicines, setMedicines] = useState("Paracetamol 500mg (1-0-1 खाने के बाद) x 3 दिन\nCetirizine 10mg (0-0-1 रात को) x 3 दिन");
  const [advice, setAdvice] = useState("पर्याप्त मात्रा में गुनगुना पानी पिएं और आराम करें। यदि 48 घंटे में बुखार न उतरे तो नज़दीकी क्लिनिक में दिखाएं।");
  const [notice, setNotice] = useState("तैयार हैं।");

  // Active Call Cockpit Modal State
  const [activeCallModal, setActiveCallModal] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "dialing" | "connected" | "ended">("idle");
  const [callSeconds, setCallSeconds] = useState(0);

  const currentDoctor = useMemo(() => {
    if (!sessionUser) return doctors[0] ?? null;
    return doctors.find((d) => d.phone === sessionUser.phone) ?? doctors[0] ?? null;
  }, [doctors, sessionUser]);

  const queue = useMemo(
    () => consultations.filter(
      (item) => item.paymentStatus === "paid" &&
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
    if (typeof window === "undefined") return null;
    return localStorage.getItem("neighbourdoc_doctor_token") || localStorage.getItem("neighbordoc_doctor_token");
  }

  async function refresh() {
    try {
      const token = getDoctorToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [doctorResponse, consultationsResponse] = await Promise.all([
        fetch("/api/doctors", { headers }),
        fetch("/api/consultations", { headers })
      ]);
      if (doctorResponse.ok) setDoctors(await doctorResponse.json());
      if (consultationsResponse.ok) setConsultations(await consultationsResponse.json());
      setNotice("मरीज़ों की कतार अपडेट हो गई है।");
    } catch {
      setNotice("सर्वर से संपर्क नहीं हो पाया।");
    }
  }

  useEffect(() => {
    const saved =
      localStorage.getItem("neighbourdoc_doctor_session") ||
      localStorage.getItem("neighbordoc_doctor_session");
    if (saved) {
      try {
        setSessionUser(JSON.parse(saved));
      } catch {}
    }
    void refresh();

    const interval = setInterval(() => {
      void refresh();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  async function handleSendOtp() {
    setAuthError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: loginPhone, role: "doctor" })
    });
    const data = await res.json();
    if (data.ok) {
      setOtpSent(true);
      setNotice("OTP आपके नंबर " + loginPhone + " पर भेजा गया (डेमो OTP: 123456)");
    } else {
      setAuthError(data.error ?? "OTP भेजने में असमर्थ।");
    }
  }

  async function handleVerifyOtp(phone = loginPhone, code = loginOtp) {
    setAuthError("");
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code, role: "doctor" })
    });
    const data = await res.json();
    if (data.ok) {
      const matchedDoctor = doctors.find((d) => d.phone === phone);
      const user = { name: matchedDoctor?.name ?? "डॉ. प्रिया शर्मा", phone };
      setSessionUser(user);
      if (data.sessionToken) {
        localStorage.setItem("neighbourdoc_doctor_token", data.sessionToken);
        localStorage.setItem("neighbordoc_doctor_token", data.sessionToken);
      }
      localStorage.setItem("neighbourdoc_doctor_session", JSON.stringify(user));
      localStorage.setItem("neighbordoc_doctor_session", JSON.stringify(user));
      setNotice(`नमस्ते, ${user.name}`);
    } else {
      setAuthError(data.error ?? "अमान्य OTP कोड।");
    }
  }

  function handleLogout() {
    localStorage.removeItem("neighbourdoc_doctor_session");
    localStorage.removeItem("neighbourdoc_doctor_token");
    localStorage.removeItem("neighbordoc_doctor_session");
    localStorage.removeItem("neighbordoc_doctor_token");
    setSessionUser(null);
    setOtpSent(false);
    setNotice("लॉगआउट हो गए।");
  }

  async function toggleAvailability() {
    if (!currentDoctor) return;
    const token = getDoctorToken();
    const next = currentDoctor.availabilityStatus === "online" ? "offline" : "online";
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

    // Initiate genuine telephony click-to-call PSTN bridge
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

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E9ECEF] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0F2F2E]">डॉक्टर कॉकपिट</h1>
            <span className="rounded-full bg-[#E8F3F1] px-2.5 py-0.5 text-xs font-black text-[#0B4F48]">
              NMC वेरिफाइड
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#64748B]">
            {currentDoctor?.name} · {currentDoctor?.specialization ?? "जनरल फिजिशियन"} ({currentDoctor?.phone})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            className="rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-bold text-[#334155] hover:bg-[#F8FAFC] transition"
            onClick={createDemoPatient}
          >
            + डेमो मरीज़ जोड़ें
          </button>
          <button
            className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition ${
              currentDoctor?.availabilityStatus === "online" ? "bg-[#0B4F48] hover:bg-[#083E38]" : "bg-slate-400"
            }`}
            onClick={toggleAvailability}
          >
            ● {currentDoctor?.availabilityStatus === "online" ? "ऑनलाइन (कॉल ले रहे हैं)" : "ऑफलाइन"}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-[#E2E8F0] px-3.5 py-2 text-xs font-bold text-[#64748B] hover:bg-slate-100"
          >
            लॉगआउट
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs font-bold text-[#107569]">{notice}</p>

      {/* Metrics Row */}
      <section className="mt-5 grid gap-4 sm:grid-cols-3">
        <MetricCard label="कतार में मरीज़" value={String(queue.length)} tone={queue.length > 0 ? "amber" : "green"} />
        <MetricCard label="आज पूरे किए परामर्श" value={String(currentDoctor?.callsToday ?? 0)} tone="green" />
        <MetricCard label="आज की कुल कमाई" value={`₹${currentDoctor?.earnedToday ?? 0}`} tone="teal" />
      </section>

      {/* Main Grid: Queue & Prescription Preview */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Incoming Queue */}
        <Surface className="border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#0F2F2E]">प्रतीक्षारत मरीज़ (15 मिनट SLA)</h2>
              <p className="text-xs text-[#64748B]">मरीज़ों की कतार समयानुसार व्यवस्थित है</p>
            </div>
            <button onClick={refresh} className="text-xs font-bold text-[#0B4F48] hover:underline">
              ⟳ रीफ्रेश करें
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 transition ${
                  selected?.id === item.id ? "border-[#0B4F48] bg-[#F0F7F6]" : "border-[#E9ECEF] bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-md bg-[#E2E8F0] px-2 py-0.5 text-[10px] font-mono font-bold text-[#475569]">
                      टोकन: {item.id.slice(0, 16)}
                    </span>
                    <p className="mt-1 text-base font-black text-[#0F2F2E]">{item.symptoms}</p>
                    <p className="mt-0.5 text-xs text-[#64748B]">
                      गंभीरता: <span className="font-bold capitalize">{item.urgencyLevel}</span> · कॉलबैक समय:{" "}
                      <span className="font-bold text-[#0B4F48]">
                        {item.callbackDeadline
                          ? new Date(item.callbackDeadline).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                          : "15 मिनट में"}
                      </span>
                    </p>
                  </div>
                  <span className="rounded-full bg-[#E8F3F1] px-2.5 py-0.5 text-xs font-bold text-[#0B4F48]">
                    फीस पूर्ण (₹{item.plan === "priority" || item.amount === 9900 ? "99" : "49"})
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <PrimaryButton onClick={() => startConsultation(item.id)} className="text-xs py-2 px-4">
                    📞 कॉल व परामर्श शुरू करें
                  </PrimaryButton>
                  <button
                    className="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs font-bold text-[#475569] hover:bg-slate-50"
                    onClick={() => setNotice(`टोकन ${item.id} को सीनियर रिव्यू के लिए चिह्नित किया गया।`)}
                  >
                    एस्केलेट
                  </button>
                </div>
              </div>
            ))}

            {queue.length === 0 && (
              <div className="rounded-2xl bg-[#F8FAF9] p-8 text-center text-[#64748B]">
                <p className="font-bold text-sm">अभी कोई मरीज़ कतार में नहीं है।</p>
                <p className="mt-1 text-xs">ऊपर &quot;+ डेमो मरीज़ जोड़ें&quot; बटन दबाकर नया केस जोड़ें।</p>
              </div>
            )}
          </div>
        </Surface>

        {/* Prescription Form / Quick Pad */}
        <Surface className="border-[#E2E8F0]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-[#0F2F2E]">डिजिटल पर्चा (Rx) फॉर्मूलेशन</h2>
              <p className="text-xs text-[#64748B]">यह पर्चा मरीज़ के WhatsApp और PDF पर स्वतः भेजा जाएगा</p>
            </div>
            <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              List O / List A केवल
            </span>
          </div>

          <div className="mt-3 rounded-xl bg-[#F8FAF9] p-2.5 text-[11px] text-[#64748B] border border-[#E9ECEF] leading-tight">
            ⚖️ <strong>सांविधिक नियम (NMC):</strong> टेलीमेडिसिन में Schedule X (नशीली/नींद की दवाएं) व इंजेक्शन प्रतिबंधित हैं।
          </div>

          <div className="mt-4 space-y-3.5">
            <div>
              <label className="text-xs font-bold text-[#334155]">दवाइयां व खुराक (Medicines &amp; Dosage)</label>
              <textarea
                className="mt-1 min-h-[110px] w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-xs font-medium text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                value={medicines}
                onChange={(e) => setMedicines(e.target.value)}
                placeholder="दवा का नाम, क्षमता, खुराक (सुबह-दोपहर-रात), कितने दिन"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#334155]">डॉक्टर की सलाह व परहेज (Advice &amp; Diet)</label>
              <textarea
                className="mt-1 min-h-[90px] w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-xs font-medium text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                placeholder="परहेज, क्या खाएं-पिएं, फ़ॉलोअप निर्देश"
              />
            </div>

            <div className="pt-2">
              <PrimaryButton disabled={!selected} onClick={completeConsultation} className="w-full text-xs py-3">
                ✓ परामर्श पूरा करें व पर्चा जारी करें
              </PrimaryButton>
            </div>
          </div>
        </Surface>
      </section>

      {/* ACTIVE CALL COCKPIT MODAL */}
      {activeCallModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#072421]/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#D1E6E3]">
            <div className="flex items-center justify-between border-b border-[#E9ECEF] pb-4">
              <div>
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase text-red-800 animate-pulse">
                  ● लाइव टेली-परामर्श जारी
                </span>
                <h3 className="mt-1 text-xl font-black text-[#0F2F2E]">मरीज़ कॉलबैक कॉकपिट</h3>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-black text-[#0B4F48]">{formatTimer(callSeconds)}</span>
                <p className="text-[10px] font-bold text-[#64748B]">बातचीत समय</p>
              </div>
            </div>

            {/* Patient & Masked Phone Telephony Card */}
            <div className="mt-5 rounded-2xl border border-[#D1E6E3] bg-[#F2F8F7] p-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-[#64748B]">मरीज़ संदर्भ: {selected.patientId}</p>
                  <p className="text-sm font-black text-[#0F2F2E] mt-0.5">तकलीफ़: {selected.symptoms}</p>
                  <p className="text-xs font-semibold text-[#107569] mt-0.5">
                    सुरक्षित मास्क किया गया नंबर: <span className="font-mono">+91 97XXXXXX01 (Exotel PSTN ब्रिज)</span>
                  </p>
                </div>
                <div className="rounded-xl bg-white px-3 py-1.5 text-center shadow-sm border border-[#D1E6E3]">
                  <span className="text-xs font-black text-[#0B4F48] capitalize">
                    {callStatus === "connected" ? "🔊 कॉल कनेक्टेड" : "📞 डायलिंग..."}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Rx Entry inside the call */}
            <div className="mt-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-[#334155]">दवाइयां (सीधे पर्चे में जुड़ेंगी)</label>
                <textarea
                  className="mt-1 min-h-[90px] w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-xs font-medium text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                  value={medicines}
                  onChange={(e) => setMedicines(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155]">सलाह व निर्देश</label>
                <input
                  className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-medium text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#E9ECEF] pt-4">
              <button
                onClick={() => setActiveCallModal(false)}
                className="rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-xs font-bold text-[#475569] hover:bg-slate-50"
              >
                विंडो मिनिमाइज़ करें
              </button>
              <button
                onClick={completeConsultation}
                className="rounded-xl bg-[#0B4F48] px-5 py-2.5 text-xs font-black text-white hover:bg-[#083E38] shadow"
              >
                कॉल समाप्त करें व पर्चा भेजें &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 border-t border-[#E2E8F0] pt-4 text-center text-xs text-[#94A3B8]">
        NeighbourDoc Telehealth Clinical Suite · Developed &amp; Powered by <strong>Qsura India Pvt. Ltd.</strong>
      </footer>
    </main>
  );
}
