"use client";

import { useEffect, useState } from "react";
import { MetricCard, PrimaryButton, Surface } from "@neighbordoc/ui";

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

export function AdminDashboardClient() {
  // Authentication State
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminPhone, setAdminPhone] = useState("+919999999999");
  const [adminOtp, setAdminOtp] = useState("123456");
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState("");

  // Data State
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [performance, setPerformance] = useState<DoctorPerformance[]>([]);
  const [notice, setNotice] = useState("डेटा लोड हो रहा है...");

  async function refresh() {
    const token = localStorage.getItem("neighbordoc_admin_token");
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [dashboardResponse, consultationsResponse, doctorsResponse] = await Promise.all([
        fetch("/api/admin/dashboard", { headers }),
        fetch("/api/consultations", { headers }),
        fetch("/api/admin/doctor-performance", { headers })
      ]);
      if (dashboardResponse.status === 401 || dashboardResponse.status === 403) {
        handleLogout();
        setAuthError("सत्र समाप्त हो गया है। कृपया दोबारा लॉगिन करें।");
        return;
      }
      if (dashboardResponse.ok) setMetrics(await dashboardResponse.json());
      if (consultationsResponse.ok) setConsultations(await consultationsResponse.json());
      if (doctorsResponse.ok) setPerformance(await doctorsResponse.json());
      setNotice("लाइव ऑपरेशनल डेटा अपडेट हो गया है।");
    } catch {
      setNotice("सर्वर से संपर्क नहीं हो पाया।");
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("neighbordoc_admin_token");
    if (token) {
      setIsAdminAuth(true);
      void refresh();
    }

    const interval = setInterval(() => {
      const activeToken = localStorage.getItem("neighbordoc_admin_token");
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
      localStorage.setItem("neighbordoc_admin_token", data.sessionToken);
      localStorage.setItem("neighbordoc_admin_session", "true");
      void refresh();
    } else {
      setAuthError(data.error ?? "अमान्य OTP कोड।");
    }
  }

  function handleLogout() {
    localStorage.removeItem("neighbordoc_admin_token");
    localStorage.removeItem("neighbordoc_admin_session");
    setIsAdminAuth(false);
    setOtpSent(false);
  }

  const exportReport = () => {
    const blob = new Blob([JSON.stringify({ metrics, consultations, performance }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `neighbordoc-admin-audit-${new Date().toISOString().slice(0, 10)}.json`;
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
            <h1 className="mt-3 text-2xl font-black text-[#0F172A]">NeighborDoc ऑपरेशंस</h1>
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
          </div>
          <p className="mt-0.5 text-xs text-[#64748B]">
            परामर्श समयसीमा (15-Min SLA), कुल राजस्व, डॉक्टर कतार व ऑडिट रिपोर्ट।
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

      <p className="mt-3 text-xs font-bold text-[#107569]">{notice}</p>

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
                  <th className="py-2.5">15-Min SLA</th>
                  <th className="py-2.5">शुल्क</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {consultations.map((row) => (
                  <tr className="hover:bg-[#F8FAFC]" key={row.id}>
                    <td className="py-3 font-mono text-[11px] font-bold text-[#0B4F48]">{row.id.slice(0, 14)}</td>
                    <td className="py-3 font-medium text-[#334155]">{row.symptoms}</td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                        row.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : row.status === "in_consultation"
                          ? "bg-blue-100 text-blue-800 animate-pulse"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {row.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        row.paymentStatus === "paid" ? "text-emerald-700" : "text-slate-500"
                      }`}>
                        {row.paymentStatus === "paid" ? "सफल" : "लंबित"}
                      </span>
                    </td>
                    <td className="py-3 text-[11px] font-bold text-[#475569]">
                      {row.callbackDeadline
                        ? new Date(row.callbackDeadline).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                        : "प्रतीक्षा"}
                    </td>
                    <td className="py-3 font-bold text-[#0F172A]">₹{row.amount / 100}</td>
                  </tr>
                ))}
                {consultations.length === 0 && (
                  <tr>
                    <td className="py-8 text-center text-[#94A3B8]" colSpan={6}>
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
              <div className="rounded-xl border border-[#E9ECEF] bg-[#FAFBF9] p-3.5 transition hover:bg-[#F1F5F9]" key={doc.doctorId}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-[#0F172A]">{doc.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    doc.availabilityStatus === "online" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                  }`}>
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

      <footer className="mt-8 border-t border-[#E2E8F0] pt-4 text-center text-xs text-[#94A3B8]">
        NeighborDoc Operations Platform · Developed &amp; Maintained by <strong>Qsura India Pvt. Ltd.</strong>
      </footer>
    </main>
  );
}
