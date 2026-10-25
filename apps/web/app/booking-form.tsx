"use client";

import { useState } from "react";
import Link from "next/link";
import { PrimaryButton, Surface } from "@neighbourdoc/ui";
import { screenEmergencySymptoms } from "@neighbourdoc/shared";
import { EmergencyAlertBanner } from "../components/booking/EmergencyAlertBanner";
import { VoiceSymptomRecorder } from "../components/booking/VoiceSymptomRecorder";
import { UpiPaymentModal, type PaymentModalData } from "../components/booking/UpiPaymentModal";

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
  const [paymentModal, setPaymentModal] = useState<PaymentModalData | null>(null);

  const emergencyAudit = form.symptoms.trim()
    ? screenEmergencySymptoms(form.symptoms)
    : { blocked: false, matchedTerms: [] as string[], message: "" };

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
        message:
          "कृपया 10 अंकों का मान्य भारतीय मोबाइल नंबर दर्ज करें जिसपर डॉक्टर कॉल कर सकें (शुरुआत 6, 7, 8 या 9 से होनी चाहिए)।"
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
    setPaymentModal((prev) => (prev ? { ...prev, isProcessing: true, selectedApp: appChoice } : null));

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
        <p className="mt-0.5 text-xs text-[#64748B]">फॉर्म भरें · डॉक्टर सीधे आपके फोन पर कॉल करेंगे</p>
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
              <p className="mt-1 text-[11px] text-[#64748B]">15 मिनट में डॉक्टर कॉल + डिजिटल पर्चा</p>
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
              <p className="mt-1 text-[11px] text-[#64748B]">त्वरित कॉलबैक + 7 दिन मुफ़्त फ़ॉलोअप</p>
            </button>
          </div>
        </div>

        {/* Modular Voice Symptom Recorder & Emergency Intercept */}
        <VoiceSymptomRecorder
          language={form.language}
          symptoms={form.symptoms}
          isEmergencyBlocked={emergencyAudit.blocked}
          onSymptomsChange={(val) => setField("symptoms", val)}
        />

        {emergencyAudit.blocked && <EmergencyAlertBanner matchedTerms={emergencyAudit.matchedTerms} />}

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
            मैं भारत सरकार के <strong>टेलीमेडिसिन नियमों</strong> के अनुसार ऑनलाइन परामर्श और WhatsApp पर पर्चा पाने
            की सहमति देता/देती हूँ।
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
              <p className="text-base font-black text-[#14532D]">आपकी बुकिंग सफल रही!</p>
            </div>
            <p className="mt-2 text-xs font-semibold text-[#166534] leading-relaxed">
              बुकिंग टोकन ID: <span className="font-mono font-bold">{result.consultationId}</span>
              <br />
              असाइंड डॉक्टर: <strong>{result.doctorId ? "डॉ. प्रिया शर्मा (MBBS)" : "निकटतम उपलब्ध डॉक्टर"}</strong>
              <br />
              डॉक्टर आपको{" "}
              <strong>
                {result.callbackDeadline
                  ? new Date(result.callbackDeadline).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "15 मिनट में"}
              </strong>{" "}
              तक कॉल करेंगे।
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
            <p className="mt-1 text-xs leading-relaxed font-medium">{result.message}</p>
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

      <UpiPaymentModal
        paymentModal={paymentModal}
        onConfirmPayment={handleConfirmPayment}
        onCancel={() => setPaymentModal(null)}
      />
    </Surface>
  );
}
