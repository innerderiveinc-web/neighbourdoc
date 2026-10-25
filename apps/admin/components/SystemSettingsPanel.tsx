"use client";

import React from "react";
import { PrimaryButton, Surface } from "@neighbourdoc/ui";

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

interface SystemSettingsPanelProps {
  settings: SystemSettings | null;
  settingsForm: Partial<SystemSettings>;
  savingSettings: boolean;
  settingsNotice: string;
  onChange: (patch: Partial<SystemSettings>) => void;
  onReset: () => void;
  onSave: () => void;
}

export function SystemSettingsPanel({
  settings,
  settingsForm,
  savingSettings,
  settingsNotice,
  onChange,
  onReset,
  onSave
}: SystemSettingsPanelProps) {
  return (
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
                onChange={(e) => onChange({ basicConsultationFee: Number(e.target.value) })}
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
                onChange={(e) => onChange({ priorityConsultationFee: Number(e.target.value) })}
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
                onChange={(e) => onChange({ doctorPayoutShare: Number(e.target.value) })}
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
                onChange={(e) => onChange({ slaCallbackMinutes: Number(e.target.value) })}
              />
              <p className="mt-0.5 text-[11px] text-[#64748B]">मानक: 15 मिनट (इस अवधि के बाद कॉल एस्केलेट होती है)</p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#334155]">आपातकालीन हेल्पलाइन (Emergency Helplines)</label>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
                value={settingsForm.emergencyHelpline ?? "112 / 108"}
                onChange={(e) => onChange({ emergencyHelpline: e.target.value })}
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
                onChange={(e) => onChange({ supportPhone: e.target.value })}
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
                  onChange({
                    activeOtpProvider: e.target.value as "mock" | "msg91" | "twilio"
                  })
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
                  onChange({
                    activePaymentGateway: e.target.value as "mock" | "razorpay"
                  })
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
                  onChange={(e) => onChange({ maintenanceMode: e.target.checked })}
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
                onChange={(e) => onChange({ maintenanceMessage: e.target.value })}
              />
            </div>

            <div className="rounded-xl bg-[#F1F5F9] p-3 text-[11px] text-[#475569]">
              <p>
                <strong>अंतिम अद्यतन (Last Updated):</strong>{" "}
                {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString("en-IN") : "उपलब्ध नहीं"}
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
          onClick={onReset}
          className="rounded-xl border border-[#CBD5E1] bg-white px-5 py-2.5 text-xs font-bold text-[#334155] hover:bg-[#F8FAFC] transition"
        >
          ↺ रीसेट करें
        </button>
        <PrimaryButton
          onClick={onSave}
          disabled={savingSettings}
          className="bg-[#0B4F48] hover:bg-[#083E38] text-white px-6 py-2.5 text-xs font-black shadow-md"
        >
          {savingSettings ? "सुरक्षित किया जा रहा है..." : "💾 सेटिंग्स सुरक्षित करें (Save System Settings)"}
        </PrimaryButton>
      </div>
    </section>
  );
}
