"use client";

import { useEffect, useState } from "react";
import { MetricCard, PrimaryButton, Surface } from "@neighbourdoc/ui";

type Metrics = {
  totalConsultations: number;
  completedConsultations: number;
  pendingConsultations: number;
  dailyRevenue: number;
  averageCallbackTimeMinutes: number;
  completionRate: number;
  doctorsOnline: number;
};

type Consultation = {
  id: string;
  symptoms: string;
  status: string;
  paymentStatus: string;
  amount: number;
  callbackDeadline: string | null;
};

type DoctorPerformance = {
  doctorId: string;
  name: string;
  callsToday: number;
  rating: number;
  earnedToday: number;
  availabilityStatus: string;
};

type SystemSettings = {
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

export function AdminDashboardClient() {
  // Authentication State
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminPhone, setAdminPhone] = useState("+919999999999");
  const [adminOtp, setAdminOtp] = useState("123456");
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState("");

  // Navigation State
  const [activeTab, setActiveTab] = useState<"overview" | "settings">("overview");

  // Data State
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [performance, setPerformance] = useState<DoctorPerformance[]>([]);
  const [notice, setNotice] = useState("डेटा लोड हो रहा है...");

  // System Settings State
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<Partial<SystemSettings>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState("");

  function getAdminToken() {
    return localStorage.getItem("neighbourdoc_admin_token") || localStorage.getItem("neighbordoc_admin_token");
  }

  async function refresh() {
    const token = getAdminToken();
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [dashboardResponse, consultationsResponse, doctorsResponse, settingsResponse] = await Promise.all([
        fetch("/api/admin/dashboard", { headers }),
        fetch("/api/consultations", { headers }),
        fetch("/api/admin/doctor-performance", { headers }),
        fetch("/api/admin/settings", { headers })
      ]);
      if (dashboardResponse.status === 401 || dashboardResponse.status === 403) {
        handleLogout();
        setAuthError("सत्र समाप्त हो गया है। कृपया दोबारा लॉगिन करें।");
        return;
      }
      if (dashboardResponse.ok) setMetrics(await dashboardResponse.json());
      if (consultationsResponse.ok) setConsultations(await consultationsResponse.json());
      if (doctorsResponse.ok) setPerformance(await doctorsResponse.json());
      if (settingsResponse.ok) {
        const fetchedSettings = (await settingsResponse.json()) as SystemSettings;
        setSettings(fetchedSettings);
        setSettingsForm((prev) => (Object.keys(prev).length === 0 ? fetchedSettings : prev));
      }
      setNotice("लाइव ऑपरेशनल डेटा अपडेट हो गया है।");
    } catch {
      setNotice("सर्वर से संपर्क नहीं हो पाया।");
    }
  }

  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      setIsAdminAuth(true);
      void refresh();
    }

    const interval = setInterval(() => {
      const activeToken = getAdminToken();
      if (activeToken) {
        void refresh();
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  async function handleSendOtp() {
    setAuthError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: adminPhone, role: "admin" })
    });
    const data = await res.json();
    if (data.ok) {
      setOtpSent(true);
      setNotice("एडमिन OTP भेजा गया (डेमो OTP: 123456)");
    } else {
      setAuthError(data.error ?? "OTP भेजने में त्रुटि।");
    }
  }

  async function handleVerifyOtp(phone = adminPhone, code = adminOtp) {
    setAuthError("");
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code, role: "admin" })
    });
    const data = await res.json();
    if (data.ok && data.sessionToken) {
      setIsAdminAuth(true);
      localStorage.setItem("neighbourdoc_admin_token", data.sessionToken);
      localStorage.setItem("neighbourdoc_admin_session", "true");
      localStorage.setItem("neighbordoc_admin_token", data.sessionToken);
      void refresh();
    } else {
      setAuthError(data.error ?? "अमान्य OTP कोड।");
    }
  }

  function handleLogout() {
    localStorage.removeItem("neighbourdoc_admin_token");
    localStorage.removeItem("neighbourdoc_admin_session");
    localStorage.removeItem("neighbordoc_admin_token");
    localStorage.removeItem("neighbordoc_admin_session");
    setIsAdminAuth(false);
    setOtpSent(false);
  }

  async function handleSaveSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const token = getAdminToken();
    if (!token) return;

    setSavingSettings(true);
    setSettingsNotice("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settingsForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data);
        setSettingsForm(data);
        setSettingsNotice("✓ सिस्टम सेटिंग्स सफलतापूर्वक अपडेट व सुरक्षित हो गई हैं!");
      } else {
        setSettingsNotice(`✗ त्रुटि: ${data.error ?? "सेटिंग्स अपडेट नहीं हो पाईं।"}`);
      }
    } catch {
      setSettingsNotice("✗ सर्वर से कनेक्शन विफल रहा।");
    } finally {
      setSavingSettings(false);
    }
  }

  function handleResetSettings() {
    if (settings) {
      setSettingsForm(settings);
      setSettingsNotice("फॉर्म वर्तमान सेटिंग्स पर रीसेट कर दिया गया।");
    }
  }

  async function handleIssueRefund(consultationId: string) {
    const token = getAdminToken();
    if (!token) return;
    const confirmRefund = window.confirm("क्या आप इस परामर्श के लिए 15-मिनट गारंटी रिफंड जारी करना चाहते हैं?");
    if (!confirmRefund) return;

    try {
      const res = await fetch(`/api/consultations/${consultationId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: "15-minute SLA breach guarantee refund (Admin Executed)" })
      });
      const data = await res.json();
      if (res.ok) {
        alert("✓ रिफंड सफलतापूर्वक प्रोसेस हो गया है और मरीज़ को सूचित कर दिया गया है।");
        refresh();
      } else {
        alert(`✗ त्रुटि: ${data.error ?? "रिफंड प्रोसेस नहीं हो सका।"}`);
      }
    } catch {
      alert("✗ सर्वर से कनेक्शन विफल रहा।");
    }
  }

  const exportReport = () => {
    const blob = new Blob(
      [JSON.stringify({ metrics, consultations, performance, settings }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `neighbourdoc-admin-audit-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Login Gate View
  if (!isAdminAuth) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <Surface className="border-[#E2E8F0] shadow-[0_10px_30px_-5px_rgba(15,23,42,0.08)]">
          <div className="text-center">
            <span className="inline-block rounded-full bg-[#0F172A] px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
              सुरक्षित एडमिनिस्ट्रेशन
            </span>
            <h1 className="mt-3 text-2xl font-black text-[#0F172A]">NeighbourDoc ऑपरेशंस</h1>
            <p className="mt-1 text-xs text-[#64748B]">मरीज़ कॉलबैक, राजस्व व डॉक्टर निगरानी डैशबोर्ड</p>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#334155]">एडमिन मोबाइल नंबर</label>
              <input
                className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] focus:border-[#0F172A] focus:bg-white focus:outline-none"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="+919999999999"
              />
            </div>

            {otpSent && (
              <div>
                <label className="text-xs font-bold text-[#334155]">6-अंकों का एडमिन OTP</label>
                <input
                  className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-center text-lg font-black tracking-widest text-[#0F172A] focus:border-[#0F172A] focus:bg-white focus:outline-none"
                  value={adminOtp}
                  onChange={(e) => setAdminOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
            )}

            {authError && <p className="text-xs font-bold text-red-600">{authError}</p>}

            {!otpSent ? (
              <PrimaryButton onClick={handleSendOtp} className="w-full bg-[#0F172A] hover:bg-[#1E293B]">
                एडमिन OTP भेजें
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => handleVerifyOtp()} className="w-full bg-[#0F172A] hover:bg-[#1E293B]">
                सत्यापित करें व डैशबोर्ड खोलें
              </PrimaryButton>
            )}

            <div className="mt-4 border-t border-[#F1F5F9] pt-4 text-center">
              <button
                onClick={() => handleVerifyOtp("+919999999999", "123456")}
                className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2.5 text-xs font-black text-[#334155] hover:bg-[#EEF2F6] transition"
              >
                🔒 त्वरित एडमिन डेमो लॉगिन (+919999999999)
              </button>
            </div>
          </div>
        </Surface>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0F172A]">ऑपरेशंस व SaaS एडमिन</h1>
            <span className="rounded-full bg-[#E8F3F1] px-2.5 py-0.5 text-xs font-black text-[#0B4F48]">
              लाइव नेटवर्क स्थिति
            </span>
            {settings?.maintenanceMode && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-black text-red-800 animate-pulse">
                ⚠️ मेंटेनेंस मोड सक्रिय
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[#64748B]">
            परामर्श समयसीमा (15-Min SLA), कुल राजस्व, डॉक्टर कतार व सिस्टम सेटिंग्स नियंत्रण।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            className="rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-bold text-[#334155] hover:bg-[#F8FAFC] transition"
            onClick={refresh}
          >
            ⟳ रीफ्रेश करें
          </button>
          <button
            className="rounded-xl bg-[#0B4F48] px-4 py-2 text-xs font-bold text-white hover:bg-[#083E38] shadow transition"
            onClick={exportReport}
          >
            📥 ऑडिट रिपोर्ट (JSON)
          </button>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-[#E2E8F0] px-3.5 py-2 text-xs font-bold text-[#64748B] hover:bg-slate-100"
          >
            लॉगआउट
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-4 flex border-b border-[#E2E8F0] space-x-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black transition border-b-2 ${
            activeTab === "overview"
              ? "border-[#0B4F48] text-[#0B4F48] bg-[#E8F3F1]/40 rounded-t-lg"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <span>📊</span> ओवरव्यू और लाइव मॉनिटरिंग
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black transition border-b-2 ${
            activeTab === "settings"
              ? "border-[#0B4F48] text-[#0B4F48] bg-[#E8F3F1]/40 rounded-t-lg"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <span>⚙️</span> सिस्टम सेटिंग्स (System Settings)
        </button>
      </div>

      <p className="mt-3 text-xs font-bold text-[#107569]">{notice}</p>

      {/* Tab 1: Overview and Live Monitoring */}
      {activeTab === "overview" && (
        <>
          {/* Top KPI Cards */}
          <section className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <MetricCard label="कुल परामर्श (Total)" value={String(metrics?.totalConsultations ?? 0)} tone="teal" />
            <MetricCard
              label="आज का कुल राजस्व"
              value={`₹${((metrics?.dailyRevenue ?? 0) / 100).toLocaleString("en-IN")}`}
              tone="green"
            />
            <MetricCard
              label="प्रतीक्षारत कॉल्स (Pending)"
              value={String(metrics?.pendingConsultations ?? 0)}
              tone={(metrics?.pendingConsultations ?? 0) > 0 ? "amber" : "green"}
            />
            <MetricCard label="ऑनलाइन डॉक्टर" value={String(metrics?.doctorsOnline ?? 0)} tone="teal" />
          </section>

          {/* Main Split Grid */}
          <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Real-time Consultation Timeline */}
            <Surface className="border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-[#0F172A]">लाइव परामर्श टाइमलाइन</h2>
                <span className="text-xs text-[#64748B]">रीयल-टाइम सिंक</span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[550px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[11px] font-bold uppercase text-[#64748B]">
                      <th className="py-2.5">टोकन ID</th>
                      <th className="py-2.5">लक्षण</th>
                      <th className="py-2.5">स्थिति</th>
                      <th className="py-2.5">भुगतान</th>
                      <th className="py-2.5">{settings?.slaCallbackMinutes ?? 15}-Min SLA</th>
                      <th className="py-2.5">शुल्क</th>
                      <th className="py-2.5 text-right">कार्रवाई (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {consultations.map((row) => (
                      <tr className="hover:bg-[#F8FAFC]" key={row.id}>
                        <td className="py-3 font-mono text-[11px] font-bold text-[#0B4F48]">{row.id.slice(0, 14)}</td>
                        <td className="py-3 font-medium text-[#334155]">{row.symptoms}</td>
                        <td className="py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                              row.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : row.status === "refunded"
                                ? "bg-rose-100 text-rose-800"
                                : row.status === "in_consultation"
                                ? "bg-blue-100 text-blue-800 animate-pulse"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {row.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              row.paymentStatus === "paid" ? "text-emerald-700" : row.paymentStatus === "refunded" ? "text-rose-700" : "text-slate-500"
                            }`}
                          >
                            {row.paymentStatus === "paid" ? "सफल" : row.paymentStatus === "refunded" ? "रिफंडेड" : "लंबित"}
                          </span>
                        </td>
                        <td className="py-3 text-[11px] font-bold text-[#475569]">
                          {row.callbackDeadline
                            ? new Date(row.callbackDeadline).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "प्रतीक्षा"}
                        </td>
                        <td className="py-3 font-bold text-[#0F172A]">₹{row.amount / 100}</td>
                        <td className="py-3 text-right">
                          {row.status === "refunded" ? (
                            <span className="inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                              रिफंडेड
                            </span>
                          ) : row.status !== "completed" && row.callbackDeadline && new Date(row.callbackDeadline).getTime() < Date.now() ? (
                            <button
                              onClick={() => handleIssueRefund(row.id)}
                              className="rounded-lg bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-700 transition shadow-sm"
                            >
                              SLA रिफंड करें
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#94A3B8]">सामान्य</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {consultations.length === 0 && (
                      <tr>
                        <td className="py-8 text-center text-[#94A3B8]" colSpan={7}>
                          अभी कोई परामर्श दर्ज नहीं हुआ है।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Surface>

            {/* Doctor Leaderboard */}
            <Surface className="border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-[#0F172A]">चिकित्सक कार्यकुशलता (Performance)</h2>
                <span className="text-xs font-bold text-[#0B4F48]">सक्रिय</span>
              </div>

              <div className="mt-4 space-y-3">
                {performance.map((doc) => (
                  <div
                    className="rounded-xl border border-[#E9ECEF] bg-[#FAFBF9] p-3.5 transition hover:bg-[#F1F5F9]"
                    key={doc.doctorId}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-[#0F172A]">{doc.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          doc.availabilityStatus === "online"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {doc.availabilityStatus === "online" ? "उपलब्ध" : "व्यस्त/ऑफलाइन"}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-[#64748B]">
                      <span>{doc.callsToday} परामर्श पूरे</span>
                      <span className="font-bold text-[#0B4F48]">₹{doc.earnedToday} कमाई</span>
                      <span className="text-amber-500 font-bold">★ {doc.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Surface>
          </section>
        </>
      )}

      {/* Tab 2: System Settings Control Panel */}
      {activeTab === "settings" && (
        <section className="mt-5 space-y-6">
          {settingsNotice && (
            <div
              className={`rounded-xl p-4 text-xs font-bold ${
                settingsNotice.startsWith("✓")
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {settingsNotice}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Card 1: Pricing & Commission */}
            <Surface className="border-[#E2E8F0]">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div>
                  <h3 className="font-black text-sm text-[#0F172A]">💰 परामर्श शुल्क व डॉक्टर कमीशन</h3>
                  <p className="text-xs text-[#64748B]">मरीज़ों के लिए फीस और डॉक्टर को मिलने वाली राशि</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  फाइनेंशियल
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#334155]">
                    सामान्य परामर्श फीस (Basic Consultation Fee) ₹
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                    value={settingsForm.basicConsultationFee ?? 49}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, basicConsultationFee: Number(e.target.value) }))
                    }
                  />
                  <p className="mt-0.5 text-[11px] text-[#64748B]">डिफ़ॉल्ट ₹49 प्रति सामान्य परामर्श</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#334155]">
                    प्राथमिकता परामर्श फीस (Priority Consultation Fee) ₹
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                    value={settingsForm.priorityConsultationFee ?? 99}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, priorityConsultationFee: Number(e.target.value) }))
                    }
                  />
                  <p className="mt-0.5 text-[11px] text-[#64748B]">डिफ़ॉल्ट ₹99 प्रति प्रायोरिटी कॉल</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#334155]">
                    डॉक्टर का हिस्सा / कमीशन (Doctor Payout Share per call) ₹
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                    value={settingsForm.doctorPayoutShare ?? 30}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, doctorPayoutShare: Number(e.target.value) }))
                    }
                  />
                  <p className="mt-0.5 text-[11px] text-[#64748B]">
                    कंपनी नेट मार्जिन: ₹
                    {(settingsForm.basicConsultationFee ?? 49) - (settingsForm.doctorPayoutShare ?? 30)} प्रति बेसिक कॉल
                  </p>
                </div>
              </div>
            </Surface>

            {/* Card 2: SLA & Emergency Controls */}
            <Surface className="border-[#E2E8F0]">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div>
                  <h3 className="font-black text-sm text-[#0F172A]">⏱️ SLA व आपातकालीन हेल्पलाइन</h3>
                  <p className="text-xs text-[#64748B]">कॉल टाइमर और पेशेंट हेल्पलाइन नंबर</p>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                  ऑपरेशंस
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#334155]">
                    डॉक्टर कॉलबैक समय सीमा (SLA Callback Limit in Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                    value={settingsForm.slaCallbackMinutes ?? 15}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, slaCallbackMinutes: Number(e.target.value) }))
                    }
                  />
                  <p className="mt-0.5 text-[11px] text-[#64748B]">मानक: 15 मिनट (इस अवधि के बाद कॉल एस्केलेट होती है)</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#334155]">आपातकालीन हेल्पलाइन (Emergency Helplines)</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                    value={settingsForm.emergencyHelpline ?? "112 / 108"}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, emergencyHelpline: e.target.value }))
                    }
                    placeholder="112 / 108"
                  />
                  <p className="mt-0.5 text-[11px] text-[#64748B]">
                    गंभीर स्थिति में मरीज को यही हेल्पलाइन नंबर दिखाया जाता है
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#334155]">पेशेंट कस्टमर सपोर्ट फोन (Support Phone)</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                    value={settingsForm.supportPhone ?? "+918000000000"}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, supportPhone: e.target.value }))}
                    placeholder="+918000000000"
                  />
                  <p className="mt-0.5 text-[11px] text-[#64748B]">सहायता हेतु आधिकारिक सपोर्ट नंबर</p>
                </div>
              </div>
            </Surface>

            {/* Card 3: Gateway & Integrations Mode */}
            <Surface className="border-[#E2E8F0]">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div>
                  <h3 className="font-black text-sm text-[#0F172A]">🔌 गेटवे व सर्विस प्रदाता मोड</h3>
                  <p className="text-xs text-[#64748B]">SMS, OTP व भुगतान गेटवे का सक्रिय चयन</p>
                </div>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                  इंटीग्रेशन
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#334155]">OTP प्रदाता (Active OTP Provider)</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                    value={settingsForm.activeOtpProvider ?? "mock"}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        activeOtpProvider: e.target.value as "mock" | "msg91" | "twilio"
                      }))
                    }
                  >
                    <option value="mock">सैंडबॉक्स / मॉक टेस्ट (कोड: 123456)</option>
                    <option value="msg91">MSG91 (भारतीय टेलीकॉम SMS)</option>
                    <option value="twilio">Twilio Global SMS</option>
                  </select>
                  <p className="mt-0.5 text-[11px] text-[#64748B]">
                    लाइव मोड के लिए .env में क्रेडेंशियल्स कॉन्फ़िगर करें
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#334155]">भुगतान गेटवे (Payment Gateway)</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                    value={settingsForm.activePaymentGateway ?? "razorpay"}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        activePaymentGateway: e.target.value as "mock" | "razorpay"
                      }))
                    }
                  >
                    <option value="razorpay">Razorpay Live (UPI, Cards, NetBanking)</option>
                    <option value="mock">मॉक पेमेंट्स (परीक्षण मोड)</option>
                  </select>
                  <p className="mt-0.5 text-[11px] text-[#64748B]">
                    मरीजों से ऑनलाइन फीस संग्रह हेतु प्रदाता
                  </p>
                </div>
              </div>
            </Surface>

            {/* Card 4: Maintenance Governance */}
            <Surface className="border-[#E2E8F0]">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div>
                  <h3 className="font-black text-sm text-[#0F172A]">🛡️ मेंटेनेंस व सुरक्षा नियंत्रण</h3>
                  <p className="text-xs text-[#64748B]">आपातकालीन रोक व सिस्टम रखरखाव</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  गवर्नेंस
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-[#F8FAFC] p-3 border border-[#E2E8F0]">
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">सिस्टम मेंटेनेंस मोड (Maintenance Mode)</p>
                    <p className="text-[11px] text-[#64748B]">चालू होने पर मरीज को अस्थायी रखरखाव संदेश दिखेगा</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={Boolean(settingsForm.maintenanceMode)}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
                      }
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#334155]">रखरखाव घोषणा संदेश (Maintenance Message)</label>
                  <textarea
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2 text-xs font-medium text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                    value={
                      settingsForm.maintenanceMessage ??
                      "सिस्टम नियमित रखरखाव (maintenance) के अंतर्गत है। आपातकाल में 112 डायल करें।"
                    }
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, maintenanceMessage: e.target.value }))
                    }
                  />
                </div>

                <div className="rounded-xl bg-[#F1F5F9] p-3 text-[11px] text-[#475569]">
                  <p>
                    <strong>अंतिम अद्यतन (Last Updated):</strong>{" "}
                    {settings?.updatedAt
                      ? new Date(settings.updatedAt).toLocaleString("en-IN")
                      : "उपलब्ध नहीं"}
                  </p>
                  <p>
                    <strong>संपादक (Updated By):</strong> {settings?.updatedBy ?? "सिस्टम डिफ़ॉल्ट"}
                  </p>
                </div>
              </div>
            </Surface>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#E2E8F0] pt-4">
            <button
              type="button"
              onClick={handleResetSettings}
              className="rounded-xl border border-[#CBD5E1] bg-white px-5 py-2.5 text-xs font-bold text-[#334155] hover:bg-[#F8FAFC] transition"
            >
              ↺ रीसेट करें
            </button>
            <PrimaryButton
              onClick={() => handleSaveSettings()}
              disabled={savingSettings}
              className="bg-[#0B4F48] hover:bg-[#083E38] text-white px-6 py-2.5 text-xs font-black shadow-md"
            >
              {savingSettings ? "सुरक्षित किया जा रहा है..." : "💾 सेटिंग्स सुरक्षित करें (Save System Settings)"}
            </PrimaryButton>
          </div>
        </section>
      )}

      <footer className="mt-8 border-t border-[#E2E8F0] pt-4 text-center text-xs text-[#94A3B8]">
        NeighbourDoc Operations Platform · Developed &amp; Maintained by <strong>Qsura India Pvt. Ltd.</strong>
      </footer>
    </main>
  );
}
