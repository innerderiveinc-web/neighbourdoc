"use client";

import { useEffect, useState } from "react";
import { PrimaryButton, Surface } from "@neighbourdoc/ui";
import { AdminHeader } from "../components/AdminHeader";
import { KpiMetricsGrid, type KpiMetrics } from "../components/KpiMetricsGrid";
import { ConsultationsTable, type ConsultationRow } from "../components/ConsultationsTable";
import { DoctorPerformanceTable, type DoctorPerformance } from "../components/DoctorPerformanceTable";
import { SystemSettingsPanel, type SystemSettings } from "../components/SystemSettingsPanel";

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
  const [metrics, setMetrics] = useState<KpiMetrics | null>(null);
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [performance, setPerformance] = useState<DoctorPerformance[]>([]);
  const [notice, setNotice] = useState("डेटा लोड हो रहा है...");

  // System Settings State
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<Partial<SystemSettings>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState("");

  // SLA Watchdog State
  const [watchdogRunning, setWatchdogRunning] = useState(false);
  const [watchdogNotice, setWatchdogNotice] = useState("");

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
        const fetchedSettings = await settingsResponse.json();
        setSettings(fetchedSettings);
        setSettingsForm(fetchedSettings);
      }
      setNotice(`अंतिम सिंक: ${new Date().toLocaleTimeString("hi-IN")}`);
    } catch {
      setNotice("डेटा सिंक त्रुटि। पुनः प्रयास करें।");
    }
  }

  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      setIsAdminAuth(true);
      refresh();
      const timer = setInterval(refresh, 10000);
      return () => clearInterval(timer);
    }
  }, []);

  async function handleSendOtp() {
    setAuthError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: adminPhone, role: "admin" })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "OTP भेजने में विफलता।");
        return;
      }
      setOtpSent(true);
    } catch {
      setAuthError("सर्वर त्रुटि। पुनः प्रयास करें।");
    }
  }

  async function handleVerifyOtp(overridePhone?: string, overrideCode?: string) {
    setAuthError("");
    const phone = overridePhone ?? adminPhone;
    const code = overrideCode ?? adminOtp;

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
      if (data.role !== "admin" && data.role !== "superadmin") {
        setAuthError("अनाधिकृत प्रवेश: केवल एडमिन उपयोगकर्ताओं को अनुमति है।");
        return;
      }
      localStorage.setItem("neighbourdoc_admin_token", data.sessionToken);
      setIsAdminAuth(true);
      refresh();
    } catch {
      setAuthError("सत्यापन अनुरोध विफल रहा।");
    }
  }

  function handleLogout() {
    localStorage.removeItem("neighbourdoc_admin_token");
    localStorage.removeItem("neighbordoc_admin_token");
    setIsAdminAuth(false);
    setOtpSent(false);
  }

  async function handleSaveSettings() {
    const token = getAdminToken();
    if (!token) return;
    setSavingSettings(true);
    setSettingsNotice("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
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
        setSettingsNotice("✓ सिस्टम सेटिंग्स सफलतापूर्वक अपडेट की गईं!");
        setTimeout(() => setSettingsNotice(""), 4000);
      } else {
        setSettingsNotice(`✗ सेटिंग्स सेव नहीं हो सकीं: ${data.error ?? "अज्ञात त्रुटि"}`);
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
      setSettingsNotice("↺ वर्तमान सेटिंग्स पर रीसेट किया गया।");
      setTimeout(() => setSettingsNotice(""), 3000);
    }
  }

  async function handleIssueRefund(consultationId: string) {
    const token = getAdminToken();
    if (!token) return;
    if (!confirm("क्या आप इस परामर्श के लिए 15-Minute SLA गारंटी के तहत पूर्ण रिफंड जारी करना चाहते हैं?")) {
      return;
    }

    try {
      const res = await fetch(`/api/consultations/${consultationId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: "SLA_BREACH_15MIN_AUTOREFUND" })
      });
      if (res.ok) {
        alert("रिफंड सफलतापूर्वक जारी किया गया व WhatsApp क्षमा संदेश भेजा गया।");
        refresh();
      } else {
        const err = await res.json();
        alert(`रिफंड त्रुटि: ${err.error ?? "विफल रहा"}`);
      }
    } catch {
      alert("रिफंड निष्पादन में विफलता।");
    }
  }

  async function handleTriggerWatchdog() {
    const token = getAdminToken();
    if (!token) return;
    setWatchdogRunning(true);
    setWatchdogNotice("");

    try {
      const res = await fetch("/api/admin/sla-watchdog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setWatchdogNotice(
          `✓ SLA वॉचडॉग चक्र पूर्ण: ${data.autoRefundedCount} स्वतः-रिफंड, ${data.escalatedCount} चिकित्सक पुनर्निधारण, ${data.healthyCount} सुरक्षित`
        );
        refresh();
      } else {
        setWatchdogNotice(`✗ वॉचडॉग त्रुटि: ${data.error ?? "चक्र निष्पादित नहीं हो सका।"}`);
      }
    } catch {
      setWatchdogNotice("✗ सर्वर से कनेक्शन विफल रहा।");
    } finally {
      setWatchdogRunning(false);
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
      <AdminHeader
        maintenanceMode={settings?.maintenanceMode}
        onRefresh={refresh}
        onExport={exportReport}
        onLogout={handleLogout}
      />

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
          <KpiMetricsGrid metrics={metrics} />

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <ConsultationsTable
              consultations={consultations}
              slaCallbackMinutes={settings?.slaCallbackMinutes ?? 15}
              watchdogRunning={watchdogRunning}
              watchdogNotice={watchdogNotice}
              onTriggerWatchdog={handleTriggerWatchdog}
              onClearNotice={() => setWatchdogNotice("")}
              onIssueRefund={handleIssueRefund}
            />

            <DoctorPerformanceTable performance={performance} />
          </section>
        </>
      )}

      {/* Tab 2: System Settings Control Panel */}
      {activeTab === "settings" && (
        <SystemSettingsPanel
          settings={settings}
          settingsForm={settingsForm}
          savingSettings={savingSettings}
          settingsNotice={settingsNotice}
          onChange={(patch) => setSettingsForm((prev) => ({ ...prev, ...patch }))}
          onReset={handleResetSettings}
          onSave={handleSaveSettings}
        />
      )}

      <footer className="mt-8 border-t border-[#E2E8F0] pt-4 text-center text-xs text-[#94A3B8]">
        NeighbourDoc Operations Platform · Proprietary Asset of <strong>Qsura India Pvt. Ltd.</strong> · Founder &amp; Chief Architect: <strong>Dr. Irfan Ashraf</strong>
      </footer>
    </main>
  );
}
