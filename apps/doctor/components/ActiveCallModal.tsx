"use client";

import React, { useMemo } from "react";
import {
  JAN_AUSHADHI_CATALOG,
  validatePrescriptionDrugs,
  type JanAushadhiMedicine
} from "@neighbourdoc/shared";
import type { ConsultationItem } from "./PatientQueueList";

interface ActiveCallModalProps {
  isOpen: boolean;
  consultation: ConsultationItem | null;
  callStatus: "idle" | "dialing" | "connected" | "ended";
  callSeconds: number;
  medicines: string;
  advice: string;
  onMedicinesChange: (val: string) => void;
  onAdviceChange: (val: string) => void;
  onAppendJanAushadhi: (med: JanAushadhiMedicine) => void;
  onClose: () => void;
  onCompleteConsultation: () => void;
}

export function ActiveCallModal({
  isOpen,
  consultation,
  callStatus,
  callSeconds,
  medicines,
  advice,
  onMedicinesChange,
  onAdviceChange,
  onAppendJanAushadhi,
  onClose,
  onCompleteConsultation
}: ActiveCallModalProps) {
  const drugSafetyAudit = useMemo(() => {
    return validatePrescriptionDrugs(medicines);
  }, [medicines]);

  if (!isOpen || !consultation) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
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
              <p className="font-bold text-[#64748B]">मरीज़ संदर्भ: {consultation.patientId}</p>
              <p className="text-sm font-black text-[#0F2F2E] mt-0.5">तकलीफ़: {consultation.symptoms}</p>
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#334155]">दवाइयां (सीधे पर्चे में जुड़ेंगी)</label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onAppendJanAushadhi(JAN_AUSHADHI_CATALOG[0])}
                  className="text-[9px] font-bold text-[#0B4F48] bg-[#E8F3F1] px-1.5 py-0.5 rounded border border-[#D1E6E3]"
                >
                  + Dolo 650
                </button>
                <button
                  type="button"
                  onClick={() => onAppendJanAushadhi(JAN_AUSHADHI_CATALOG[1])}
                  className="text-[9px] font-bold text-[#0B4F48] bg-[#E8F3F1] px-1.5 py-0.5 rounded border border-[#D1E6E3]"
                >
                  + Augmentin 625
                </button>
                <button
                  type="button"
                  onClick={() => onAppendJanAushadhi(JAN_AUSHADHI_CATALOG[3])}
                  className="text-[9px] font-bold text-[#0B4F48] bg-[#E8F3F1] px-1.5 py-0.5 rounded border border-[#D1E6E3]"
                >
                  + Pan-D
                </button>
              </div>
            </div>
            <textarea
              className={`mt-1 min-h-[90px] w-full rounded-xl border p-3 text-xs font-medium focus:outline-none ${
                !drugSafetyAudit.isCompliant
                  ? "border-red-400 bg-red-50/50 text-red-900 focus:border-red-600"
                  : "border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:border-[#0B4F48] focus:bg-white"
              }`}
              value={medicines}
              onChange={(e) => onMedicinesChange(e.target.value)}
            />
          </div>

          {!drugSafetyAudit.isCompliant && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-2.5 text-[11px] text-red-800 font-bold">
              ⛔ {drugSafetyAudit.warningMessage}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-[#334155]">सलाह व निर्देश</label>
            <input
              className="mt-1 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-2.5 text-xs font-medium text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
              value={advice}
              onChange={(e) => onAdviceChange(e.target.value)}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#E9ECEF] pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#CBD5E1] px-4 py-2.5 text-xs font-bold text-[#475569] hover:bg-slate-50"
          >
            विंडो मिनिमाइज़ करें
          </button>
          <button
            disabled={!drugSafetyAudit.isCompliant}
            onClick={onCompleteConsultation}
            className={`rounded-xl px-5 py-2.5 text-xs font-black text-white shadow ${
              !drugSafetyAudit.isCompliant
                ? "bg-red-400 cursor-not-allowed"
                : "bg-[#0B4F48] hover:bg-[#083E38]"
            }`}
          >
            {!drugSafetyAudit.isCompliant
              ? "⛔ प्रतिबंधित दवा हटाएं"
              : "कॉल समाप्त करें व पर्चा भेजें →"}
          </button>
        </div>
      </div>
    </div>
  );
}
