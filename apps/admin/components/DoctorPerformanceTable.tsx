"use client";

import React from "react";
import { Surface } from "@neighbourdoc/ui";

export type DoctorPerformance = {
  doctorId: string;
  name: string;
  callsToday: number;
  rating: number;
  earnedToday: number;
  availabilityStatus: string;
};

interface DoctorPerformanceTableProps {
  performance: DoctorPerformance[];
}

export function DoctorPerformanceTable({ performance }: DoctorPerformanceTableProps) {
  return (
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
        {performance.length === 0 && (
          <p className="py-6 text-center text-xs text-[#94A3B8]">कोई डॉक्टर डेटा उपलब्ध नहीं है।</p>
        )}
      </div>
    </Surface>
  );
}
