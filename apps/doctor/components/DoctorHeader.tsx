"use client";

import React from "react";

export type DoctorProfile = {
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

interface DoctorHeaderProps {
  doctor: DoctorProfile | null;
  onAddDemoPatient: () => void;
  onToggleAvailability: () => void;
  onLogout: () => void;
}

export function DoctorHeader({
  doctor,
  onAddDemoPatient,
  onToggleAvailability,
  onLogout
}: DoctorHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E9ECEF] pb-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-[#0F2F2E]">डॉक्टर कॉकपिट</h1>
          <span className="rounded-full bg-[#E8F3F1] px-2.5 py-0.5 text-xs font-black text-[#0B4F48]">
            NMC वेरिफाइड
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[#64748B]">
          {doctor?.name} · {doctor?.specialization ?? "जनरल फिजिशियन"} ({doctor?.phone})
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          className="rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-bold text-[#334155] hover:bg-[#F8FAFC] transition"
          onClick={onAddDemoPatient}
        >
          + डेमो मरीज़ जोड़ें
        </button>
        <button
          className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition ${
            doctor?.availabilityStatus === "online"
              ? "bg-[#0B4F48] hover:bg-[#083E38]"
              : "bg-slate-400"
          }`}
          onClick={onToggleAvailability}
        >
          ● {doctor?.availabilityStatus === "online" ? "ऑनलाइन (कॉल ले रहे हैं)" : "ऑफलाइन"}
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
