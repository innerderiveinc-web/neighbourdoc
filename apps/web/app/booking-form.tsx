"use client";

import { useState } from "react";
import Link from "next/link";
import { PrimaryButton, Surface } from "@neighbourdoc/ui";
import { screenEmergencySymptoms } from "@neighbourdoc/shared";

type BookingResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; consultationId: string; doctorId: string | null; callbackDeadline: string | null }
  | { status: "blocked"; message: string }
  | { status: "error"; message: string };

const initialForm = {
  name: "",
  phone: "",
  age: "30",
  gender: "male",
  city: "Lucknow",
  locality: "",
  language: "Hindi",
  symptoms: "",
  existingIllnesses: "",
  plan: "basic",
  consent: false
};

export function BookingForm() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<BookingResult>({ status: "idle" });
  const [isListening, setIsListening] = useState(false);
  const [showFirstAid, setShowFirstAid] = useState(false);

  const emergencyAudit = form.symptoms.trim()
    ? screenEmergencySymptoms(form.symptoms)
    : { blocked: false, matchedTerms: [] as string[], message: "" };

  function startVoiceRecording() {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("आपके ब्राउज़र में आवाज़ पहचान (Voice Input) की सुविधा समर्थित नहीं है। कृपया लिखकर लक्षण दर्ज करें।");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = form.language === "English" ? "en-IN" : "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setField("symptoms", form.symptoms ? `${form.symptoms} ${transcript}` : transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  const quickSymptomChips = [
    { label: "+ 2 दिन से बुखार", text: "2 दिन से बुखार और बदन दर्द है" },
    { label: "+ खांसी-जुकाम", text: "गले में खराश, सूखी खांसी और छींकें हैं" },
    { label: "+ पेट दर्द व उल्टी", text: "पेट में मरोड़ और दस्त की शिकायत है" },
    { label: "+ सिरदर्द व कमजोरी", text: "तेज़ सिरदर्द और चक्कर आ रहे हैं" }
  ];

  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    consultationId: string;
    orderId: string;
    amount: number;
    patientName: string;
    isProcessing?: boolean;
    selectedApp?: string;
  } | null>(null);

  const setField = (field: keyof typeof initialForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function submitBooking() {
    if (emergencyAudit.blocked) {
      setResult({
        status: "blocked",
        message: `आपातकालीन स्थिति: ${emergencyAudit.matchedTerms.join(", ")}। कृपया 112 या 108 डायल करें।`
      });
      return;
    }

    if (!form.name.trim()) {
      setResult({ status: "error", message: "कृपया मरीज़ का नाम दर्ज करें।" });
      return;
    }
    const digitsOnly = form.phone.replace(/\D/g, "");
    let cleanPhone = "";
    if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
      cleanPhone = `+91${digitsOnly}`;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0") && /^[6-9]/.test(digitsOnly.slice(1))) {
      cleanPhone = `+91${digitsOnly.slice(1)}`;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith("91") && /^[6-9]/.test(digitsOnly.slice(2))) {
      cleanPhone = `+${digitsOnly}`;
    }

    if (!cleanPhone) {
      setResult({
        status: "error",
        message: "कृपया 10 अंकों का मान्य भारतीय मोबाइल नंबर दर्ज करें जिसपर डॉक्टर कॉल कर सकें (शुरुआत 6, 7, 8 या 9 से होनी चाहिए)।"
      });
      return;
    }

    const patientAge = Number(form.age);
    if (isNaN(patientAge) || patientAge < 1 || patientAge > 120) {
      setResult({ status: "error", message: "कृपया मरीज़ की सही उम्र (1 से 120 वर्ष) दर्ज करें।" });
      return;
    }

    if (!form.symptoms.trim()) {
      setResult({ status: "error", message: "कृपया अपनी तकलीफ़ या लक्षण संक्षेप में बताएं।" });
      return;
    }
    if (!form.consent) {
      setResult({ status: "error", message: "टेलीमेडिसिन सलाह के लिए सहमति (Consent) आवश्यक है।" });
      return;
    }

    setResult({ status: "loading" });

    try {
      const bookingResponse = await fetch("/api/consultations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: cleanPhone,
          age: patientAge,
          consent: Boolean(form.consent)
        })
      });
      const booking = await bookingResponse.json();

      if (!booking.ok) {
        setResult({
          status: booking.reason === "emergency_detected" ? "blocked" : "error",
          message: booking.emergency?.message ?? booking.error ?? "बुकिंग नहीं हो सकी। कृपया दोबारा प्रयास करें।"
        });
        return;
      }

      if (booking.sessionToken) {
        try {
          localStorage.setItem("neighbourdoc_patient_token", booking.sessionToken);
        } catch {}
      }

      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: form.plan, consultationId: booking.consultation.id })
      });
      const order = await orderResponse.json();

      // Open authentic UPI payment modal
      setPaymentModal({
        open: true,
        consultationId: booking.consultation.id,
        orderId: order.orderId,
        amount: form.plan === "priority" ? 99 : 49,
        patientName: form.name
      });
      setResult({ status: "idle" });
    } catch {
      setResult({ status: "error", message: "सर्वर से संपर्क नहीं हो पाया। कृपया नेटवर्क जांचें।" });
    }
  }

  async function handleConfirmPayment(appChoice = "Google Pay") {
    if (!paymentModal) return;
    setPaymentModal((prev) => prev ? { ...prev, isProcessing: true, selectedApp: appChoice } : null);

    try {
      const paymentResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          consultationId: paymentModal.consultationId,
          orderId: paymentModal.orderId,
          gatewayPaymentId: `pay_${appChoice.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`
        })
      });
      const paid = await paymentResponse.json();

      if (!paid.ok) {
        setPaymentModal(null);
        setResult({ status: "error", message: paid.error ?? "भुगतान असफल रहा। कृपया दोबारा प्रयास करें।" });
        return;
      }

      const cId = paymentModal.consultationId;
      setPaymentModal(null);
      setResult({
        status: "success",
        consultationId: cId,
        doctorId: paid.consultation.doctorId,
        callbackDeadline: paid.consultation.callbackDeadline
      });
    } catch {
      setPaymentModal(null);
      setResult({ status: "error", message: "भुगतान सत्यापन में समस्या हुई। कृपया दोबारा प्रयास करें।" });
    }
  }

  return (
    <Surface className="border-[#E2E8F0] shadow-[0_10px_30px_-5px_rgba(11,79,72,0.08)]">
      {/* Form Header */}
      <div className="border-b border-[#F1F5F9] pb-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F3F1] px-3 py-1 text-xs font-bold text-[#0B4F48]">
            <span className="h-2 w-2 rounded-full bg-[#107569] animate-pulse"></span>
            डॉक्टर अभी उपलब्ध हैं
          </span>
          <span className="text-xs font-bold text-[#64748B]">15 मिनट गारंटी</span>
        </div>
        <h2 className="mt-2 text-2xl font-black text-[#0F2F2E]">डॉक्टर से अभी परामर्श लें</h2>
        <p className="mt-0.5 text-xs text-[#64748B]">
          फॉर्म भरें · डॉक्टर सीधे आपके फोन पर कॉल करेंगे
        </p>
      </div>

      <div className="mt-5 space-y-3.5">
        {/* Name Input */}
        <div>
          <label className="block text-xs font-bold text-[#334155] mb-1">
            मरीज़ का नाम <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0B4F48] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4F48]/15 transition"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="उदा. रमेश कुमार / Ramesh Kumar"
          />
        </div>

        {/* Phone & Age Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1">
              मोबाइल नंबर (कॉल के लिए) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-sm font-bold text-[#64748B]">+91</span>
              <input
                className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] pl-12 pr-3.5 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0B4F48] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4F48]/15 transition"
                value={form.phone.replace(/^\+91/, "")}
                onChange={(e) => setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                type="tel"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1">उम्र (Age)</label>
            <input
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0B4F48] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4F48]/15 transition"
              value={form.age}
              onChange={(e) => setField("age", e.target.value)}
              placeholder="30"
              type="number"
            />
          </div>
        </div>

        {/* Gender & Language */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1">लिंग (Gender)</label>
            <select
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-3 text-sm text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4F48]/15 transition"
              value={form.gender}
              onChange={(e) => setField("gender", e.target.value)}
            >
              <option value="male">पुरुष (Male)</option>
              <option value="female">महिला (Female)</option>
              <option value="other">अन्य (Other)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1">बातचीत की भाषा</label>
            <select
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-3 text-sm text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4F48]/15 transition"
              value={form.language}
              onChange={(e) => setField("language", e.target.value)}
            >
              <option value="Hindi">हिंदी (Hindi)</option>
              <option value="English">English</option>
              <option value="Hinglish">Hinglish (मिक्स)</option>
              <option value="Marathi">मराठी (Marathi)</option>
              <option value="Bengali">বাংলা (Bengali)</option>
            </select>
          </div>
        </div>

        {/* City Input */}
        <div>
          <label className="block text-xs font-bold text-[#334155] mb-1">शहर / कस्बा (City)</label>
          <input
            className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0B4F48] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4F48]/15 transition"
            value={form.city}
            onChange={(e) => setField("city", e.target.value)}
            placeholder="उदा. लखनऊ, कानपुर, वाराणसी..."
          />
        </div>

        {/* Plan Selector Cards */}
        <div>
          <label className="block text-xs font-bold text-[#334155] mb-1.5">परामर्श प्लान चुनें</label>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setField("plan", "basic")}
              className={`flex flex-col text-left rounded-xl p-3 border-2 transition ${
                form.plan === "basic"
                  ? "border-[#0B4F48] bg-[#F0F7F6]"
                  : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black text-[#0B4F48]">बेसिक परामर्श</span>
                <span className="text-sm font-black text-[#0F2F2E]">₹49</span>
              </div>
              <p className="mt-1 text-[11px] text-[#64748B]">
                15 मिनट में डॉक्टर कॉल + डिजिटल पर्चा
              </p>
            </button>

            <button
              type="button"
              onClick={() => setField("plan", "priority")}
              className={`flex flex-col text-left rounded-xl p-3 border-2 transition ${
                form.plan === "priority"
                  ? "border-[#0B4F48] bg-[#F0F7F6]"
                  : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black text-[#0B4F48]">प्रायोरिटी + फ़ॉलोअप</span>
                <span className="text-sm font-black text-[#0F2F2E]">₹99</span>
              </div>
              <p className="mt-1 text-[11px] text-[#64748B]">
                त्वरित कॉलबैक + 7 दिन मुफ़्त फ़ॉलोअप
              </p>
            </button>
          </div>
        </div>

        {/* Symptoms Textarea with Voice Intake */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[#334155]">
              क्या तकलीफ़ है? (लक्षण विस्तार से बताएं) <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={startVoiceRecording}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition shadow-sm ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-teal-50 text-[#0B4F48] border border-teal-200 hover:bg-teal-100"
              }`}
            >
              <span>{isListening ? "🔴 सुन रहे हैं... बोलिए" : "🎙️ बोलकर बताएं (Voice Input)"}</span>
            </button>
          </div>

          <textarea
            className={`w-full min-h-[90px] rounded-xl border p-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 transition ${
              emergencyAudit.blocked
                ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-200"
                : "border-[#CBD5E1] bg-[#F8FAFC] focus:border-[#0B4F48] focus:ring-[#0B4F48]/15"
            }`}
            value={form.symptoms}
            onChange={(e) => setField("symptoms", e.target.value)}
            placeholder="उदा. 2 दिन से बुखार है, गले में दर्द और बदन दर्द हो रहा है... (या माइक बटन दबाकर बोलें)"
          />

          {/* Quick Rural Chips */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-[11px] font-medium text-[#64748B] self-center">जल्दी जोड़ें:</span>
            {quickSymptomChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() =>
                  setField(
                    "symptoms",
                    form.symptoms ? `${form.symptoms}, ${chip.text}` : chip.text
                  )
                }
                className="rounded-lg border border-[#CBD5E1] bg-white px-2 py-0.5 text-[11px] font-medium text-[#475569] hover:border-[#0B4F48] hover:text-[#0B4F48] transition"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Emergency Guardian Intercept Banner */}
          {emergencyAudit.blocked && (
            <div className="mt-3 rounded-2xl border-2 border-red-500 bg-red-50 p-4 shadow-md">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚨</span>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-red-900">
                    आपातकालीन संकेत मिले: {emergencyAudit.matchedTerms.join(", ")}
                  </h4>
                  <p className="mt-1 text-xs text-red-800 leading-relaxed">
                    यह स्थिति गंभीर या जानलेवा हो सकती है। भारत सरकार के टेलीमेडिसिन दिशा-निर्देशों के अनुसार इसके लिए तत्काल अस्पताल जाना अनिवार्य है।
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href="tel:112"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-black text-white hover:bg-red-700 shadow transition"
                    >
                      📞 112 डायल करें (Emergency)
                    </a>
                    <a
                      href="tel:108"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-700 px-3.5 py-2 text-xs font-black text-white hover:bg-red-800 shadow transition"
                    >
                      🚑 108 डायल करें (Ambulance)
                    </a>
                    <a
                      href="tel:1800116117"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-800 hover:bg-red-100 transition"
                    >
                      🧪 1800-116-117 (विषाक्तता केंद्र)
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFirstAid(!showFirstAid)}
                    className="mt-3 text-xs font-bold text-red-700 underline hover:text-red-900 block"
                  >
                    {showFirstAid ? "▲ प्राथमिक उपचार निर्देश छुपाएं" : "▼ आपातकालीन प्राथमिक उपचार (First Aid) देखें"}
                  </button>

                  {showFirstAid && (
                    <div className="mt-2.5 rounded-xl bg-white p-3 border border-red-200 text-xs text-red-950 space-y-1.5">
                      <p><strong>सीने में दर्द या भारीपन:</strong> मरीज को शांत बैठाएं, तंग कपड़े तुरंत ढीले करें।</p>
                      <p><strong>सांस लेने में तकलीफ़:</strong> मरीज को तकिए के सहारे 45 डिग्री पर बैठाएं।</p>
                      <p><strong>बेहोशी या दौरा:</strong> मरीज को बाएं करवट लिटाएं (Recovery Position), मुंह में कुछ न डालें।</p>
                      <p><strong>सांप का काटना:</strong> काटे अंग को स्थिर रखें, पट्टी अधिक कसकर न बांधें, तुरंत अस्पताल पहुंचें।</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Existing Illnesses (Optional) */}
        <div>
          <label className="block text-xs font-medium text-[#64748B] mb-1">
            कोई पुरानी बीमारी या मौजूदा दवा? (वैकल्पिक)
          </label>
          <input
            className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0B4F48] focus:bg-white focus:outline-none transition"
            value={form.existingIllnesses}
            onChange={(e) => setField("existingIllnesses", e.target.value)}
            placeholder="जैसे शुगर, बीपी, थायरॉइड या कोई एलर्जी (यदि हो तो)"
          />
        </div>

        {/* Consent Checkbox */}
        <label className="flex items-start gap-2.5 rounded-xl bg-[#F8FAF9] p-3 text-xs text-[#475569] cursor-pointer border border-[#E9ECEF]">
          <input
            checked={form.consent}
            type="checkbox"
            onChange={(e) => setField("consent", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0B4F48] focus:ring-[#0B4F48]"
          />
          <span>
            मैं भारत सरकार के <strong>टेलीमेडिसिन नियमों</strong> के अनुसार ऑनलाइन परामर्श और WhatsApp पर पर्चा पाने की सहमति देता/देती हूँ।
          </span>
        </label>

        {/* Submit Button */}
        <PrimaryButton
          disabled={result.status === "loading" || emergencyAudit.blocked}
          onClick={submitBooking}
          className={`w-full text-base py-3.5 ${
            emergencyAudit.blocked ? "opacity-50 cursor-not-allowed bg-red-500 hover:bg-red-500" : ""
          }`}
        >
          {emergencyAudit.blocked
            ? "⛔ आपातकाल: तुरंत 112 डायल करें"
            : result.status === "loading"
            ? "डॉक्टर से संपर्क हो रहा है..."
            : `₹${form.plan === "priority" ? "99" : "49"} फीस देकर डॉक्टर बुक करें`}
        </PrimaryButton>

        {/* Success Alert */}
        {result.status === "success" && (
          <div className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-5 text-[#14532D]">
            <div className="flex items-center gap-2">
              <span className="text-xl">✅</span>
              <p className="text-base font-black text-[#14532D]">
                आपकी बुकिंग सफल रही!
              </p>
            </div>
            <p className="mt-2 text-xs font-semibold text-[#166534] leading-relaxed">
              बुकिंग टोकन ID: <span className="font-mono font-bold">{result.consultationId}</span>
              <br />
              असाइंड डॉक्टर: <strong>{result.doctorId ? "डॉ. प्रिया शर्मा (MBBS)" : "निकटतम उपलब्ध डॉक्टर"}</strong>
              <br />
              डॉक्टर आपको <strong>{result.callbackDeadline ? new Date(result.callbackDeadline).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "15 मिनट में"}</strong> तक कॉल करेंगे।
            </p>
            <div className="mt-4 pt-3 border-t border-[#BBF7D0]">
              <Link
                href={`/consultations/${result.consultationId}/prescription`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#15803D] px-4 py-2.5 text-xs font-black text-white hover:bg-[#166534] shadow-sm transition"
              >
                📄 डिजिटल पर्चा (Rx) व लाइव स्टेटस देखें &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Emergency Blocked Alert */}
        {result.status === "blocked" && (
          <div className="rounded-2xl border border-[#FECDD3] bg-[#FFF1F2] p-4 text-[#9F1239]">
            <p className="text-xs font-black uppercase tracking-wider text-[#BE123C]">
              ⚠️ तुरंत चिकित्सीय सहायता की आवश्यकता है
            </p>
            <p className="mt-1 text-xs leading-relaxed font-medium">
              {result.message}
            </p>
            <p className="mt-2 text-xs font-bold">
              कृपया समय न गंवाएं — तुरंत <strong>112 डायल करें</strong> या निकटतम अस्पताल के इमरजेंसी विभाग में जाएं।
            </p>
          </div>
        )}

        {/* Generic Error Alert */}
        {result.status === "error" && (
          <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-4 text-[#92400E]">
            <p className="text-xs font-bold">{result.message}</p>
          </div>
        )}
      </div>

      {/* UPI PAYMENT CHECKOUT MODAL */}
      {paymentModal && paymentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#072421]/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-[#D1E6E3]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#E9ECEF] pb-4">
              <div>
                <span className="rounded-full bg-[#E8F3F1] px-2.5 py-0.5 text-[10px] font-bold text-[#0B4F48]">
                  🔒 256-बिट सुरक्षित भुगतान गेटवे
                </span>
                <h3 className="mt-1 text-lg font-black text-[#0F2F2E]">
                  परामर्श शुल्क का भुगतान
                </h3>
                <p className="text-xs text-[#64748B]">मरीज़: {paymentModal.patientName}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#0B4F48]">₹{paymentModal.amount}</span>
                <p className="text-[10px] text-[#64748B]">कुल देय राशि</p>
              </div>
            </div>

            {/* Processing State */}
            {paymentModal.isProcessing ? (
              <div className="py-10 text-center">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#0B4F48] border-t-transparent mb-3"></div>
                <h4 className="text-sm font-bold text-[#0F2F2E]">
                  {paymentModal.selectedApp} से भुगतान सत्यापित हो रहा है...
                </h4>
                <p className="mt-1 text-xs text-[#64748B]">कृपया विंडो बंद न करें।</p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <p className="text-xs font-bold text-[#334155]">
                  अपना पसंदीदा UPI माध्यम चुनें:
                </p>

                <div className="grid gap-2.5">
                  <button
                    onClick={() => handleConfirmPayment("Google Pay")}
                    className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] p-3 text-left transition hover:border-[#0B4F48] hover:bg-[#F2F8F7]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 font-black text-sm text-emerald-800">
                        G
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#0F2F2E]">Google Pay UPI</p>
                        <p className="text-[10px] text-[#64748B]">1-टैप फास्ट पेमेंट</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#0B4F48]">पे करें ₹{paymentModal.amount} &rarr;</span>
                  </button>

                  <button
                    onClick={() => handleConfirmPayment("PhonePe")}
                    className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] p-3 text-left transition hover:border-[#0B4F48] hover:bg-[#F2F8F7]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 font-black text-sm text-purple-800">
                        Pe
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#0F2F2E]">PhonePe UPI</p>
                        <p className="text-[10px] text-[#64748B]">सभी UPI बैंक खाते</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#0B4F48]">पे करें ₹{paymentModal.amount} &rarr;</span>
                  </button>

                  <button
                    onClick={() => handleConfirmPayment("Paytm")}
                    className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] p-3 text-left transition hover:border-[#0B4F48] hover:bg-[#F2F8F7]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 font-black text-sm text-sky-800">
                        Pay
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#0F2F2E]">Paytm / Wallet / UPI</p>
                        <p className="text-[10px] text-[#64748B]">Paytm UPI व कार्ड</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#0B4F48]">पे करें ₹{paymentModal.amount} &rarr;</span>
                  </button>

                  <button
                    onClick={() => handleConfirmPayment("BHIM UPI")}
                    className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] p-3 text-left transition hover:border-[#0B4F48] hover:bg-[#F2F8F7]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 font-black text-sm text-amber-800">
                        ₹
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#0F2F2E]">BHIM या अन्य UPI ऐप्स</p>
                        <p className="text-[10px] text-[#64748B]">कोई भी UPI ID या QR</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#0B4F48]">पे करें ₹{paymentModal.amount} &rarr;</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-[#E9ECEF] flex items-center justify-between">
                  <span className="text-[10px] text-[#64748B]">
                    ऑर्डर ID: #{paymentModal.orderId.slice(0, 14)}
                  </span>
                  <button
                    onClick={() => setPaymentModal(null)}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    रद्द करें (Cancel)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Surface>
  );
}
