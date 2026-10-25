"use client";

import React from "react";

interface AdminHeaderProps {
  maintenanceMode?: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onLogout: () => void;
}

export function AdminHeader({ maintenanceMode, onRefresh, onExport, onLogout }: AdminHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-[#0F172A]">ऑपरेशंस व SaaS एडमिन</h1>
          <span className="rounded-full bg-[#E8F3F1] px-2.5 py-0.5 text-xs font-black text-[#0B4F48]">
            लाइव नेटवर्क स्थिति
          </span>
          {maintenanceMode && (
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
          onClick={onRefresh}
        >
          ⟳ रीफ्रेश करें
        </button>
        <button
          className="rounded-xl bg-[#0B4F48] px-4 py-2 text-xs font-bold text-white hover:bg-[#083E38] shadow transition"
          onClick={onExport}
        >
          📥 ऑडिट रिपोर्ट (JSON)
        </button>
        <button
          onClick={onLogout}
          className="rounded-xl border border-[#E2E8F0] px-3.5 py-2 text-xs font-bold text-[#64748B] hover:bg-slate-100"
        >
          लॉगआउट
        </button>
      </div>
    </div>
  );
}
